import Link from "next/link";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { canManageCalendar } from "@/lib/roles";
import { HOA_TIME_ZONE, localDateKey, zonedDateFromParts } from "@/lib/format";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function addMonths(year: number, month: number, delta: number) {
  const total = (year * 12 + (month - 1)) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const user = await requireApprovedUser();
  const { year: yearParam, month: monthParam } = await searchParams;

  const zonedNow = toZonedTime(new Date(), HOA_TIME_ZONE);
  const todayKey = localDateKey(new Date());
  const year = Number(yearParam) || zonedNow.getFullYear();
  const month = Number(monthParam) || zonedNow.getMonth() + 1;

  const rangeStart = zonedDateFromParts(year, month, 1);
  const next = addMonths(year, month, 1);
  const rangeEnd = zonedDateFromParts(next.year, next.month, 1);

  const events = await prisma.calendarEvent.findMany({
    where: { startsAt: { gte: rangeStart, lt: rangeEnd } },
    orderBy: { startsAt: "asc" },
  });

  const eventsByDay = new Map<string, typeof events>();
  for (const e of events) {
    const key = localDateKey(e.startsAt);
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(e);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const pad = (n: number) => String(n).padStart(2, "0");
  const monthLabel = format(new Date(year, month - 1, 1), "MMMM yyyy");

  const prevMonth = addMonths(year, month, -1);
  const nextMonth = addMonths(year, month, 1);

  const cells: { day: number | null; key: string | null }[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, key: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: `${year}-${pad(month)}-${pad(d)}` });

  return (
    <div>
      <PageHeader title="Community Calendar" subtitle="Board meetings, social events, and neighborhood happenings." />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Link
              href={`/calendar?year=${prevMonth.year}&month=${prevMonth.month}`}
              className="text-primary hover:underline text-sm font-medium"
            >
              ← Prev
            </Link>
            <h2 className="text-lg font-semibold text-navy">{monthLabel}</h2>
            <Link
              href={`/calendar?year=${nextMonth.year}&month=${nextMonth.month}`}
              className="text-primary hover:underline text-sm font-medium"
            >
              Next →
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/calendar/year" className="text-primary hover:underline text-sm font-medium">
              Year view
            </Link>
            {canManageCalendar(user.roles) && (
              <Link href="/admin/calendar" className="text-primary font-medium hover:underline text-sm">
                Manage events →
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border border border-border rounded-lg overflow-hidden text-sm">
          {WEEKDAYS.map((w) => (
            <div key={w} className="bg-navy text-white text-xs font-semibold uppercase tracking-wide px-2 py-1.5 text-center">
              {w}
            </div>
          ))}
          {cells.map((cell, i) => {
            const dayEvents = cell.key ? eventsByDay.get(cell.key) ?? [] : [];
            const isToday = cell.key === todayKey;
            return (
              <div key={i} className={`bg-white min-h-24 p-1.5 ${cell.day === null ? "bg-card/50" : ""}`}>
                {cell.day !== null && (
                  <>
                    <div className={`text-xs font-medium mb-1 ${isToday ? "text-white bg-primary rounded-full w-5 h-5 flex items-center justify-center" : "text-muted"}`}>
                      {cell.day}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <Link
                          key={e.id}
                          href={`/calendar/${e.id}`}
                          className="block text-xs bg-primary-light text-primary rounded px-1 py-0.5 truncate hover:bg-primary hover:text-white transition-colors"
                          title={e.title}
                        >
                          {e.allDay ? "" : format(e.startsAt, "h:mma ")}
                          {e.title}
                        </Link>
                      ))}
                      {dayEvents.length > 3 && cell.key && (
                        <Link href={`/calendar/day/${cell.key}`} className="block text-xs text-primary hover:underline">
                          +{dayEvents.length - 3} more
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
