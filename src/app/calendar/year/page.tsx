import Link from "next/link";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { HOA_TIME_ZONE, localDateKey, zonedDateFromParts } from "@/lib/format";

export const dynamic = "force-dynamic";

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

function addMonths(year: number, month: number, delta: number) {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

function MiniMonth({ year, month, eventDays }: { year: number; month: number; eventDays: Set<string> }) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const pad = (n: number) => String(n).padStart(2, "0");
  const label = format(new Date(year, month - 1, 1), "MMMM yyyy");

  const cells: { day: number | null; key: string | null }[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ day: null, key: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: `${year}-${pad(month)}-${pad(d)}` });

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <Link href={`/calendar?year=${year}&month=${month}`} className="block text-sm font-semibold text-navy hover:text-primary mb-2 text-center">
        {label}
      </Link>
      <div className="grid grid-cols-7 gap-0.5 text-[10px] text-muted mb-1">
        {WEEKDAY_INITIALS.map((w, i) => (
          <div key={i} className="text-center">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => (
          <div key={i} className="aspect-square flex flex-col items-center justify-center text-[11px] text-navy">
            {cell.day !== null && (
              <>
                <span>{cell.day}</span>
                {cell.key && eventDays.has(cell.key) && <span className="w-1 h-1 rounded-full bg-primary" />}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CalendarYearPage() {
  await requireApprovedUser();

  const zonedNow = toZonedTime(new Date(), HOA_TIME_ZONE);
  const startYear = zonedNow.getFullYear();
  const startMonth = zonedNow.getMonth() + 1;

  const rangeStart = zonedDateFromParts(startYear, startMonth, 1);
  const endOfWindow = addMonths(startYear, startMonth, 12);
  const rangeEnd = zonedDateFromParts(endOfWindow.year, endOfWindow.month, 1);

  const events = await prisma.calendarEvent.findMany({
    where: { startsAt: { gte: rangeStart, lt: rangeEnd } },
    select: { startsAt: true },
  });
  const eventDays = new Set(events.map((e) => localDateKey(e.startsAt)));

  const months = Array.from({ length: 12 }, (_, i) => addMonths(startYear, startMonth, i));

  return (
    <div>
      <PageHeader title="Calendar - Year View" subtitle="This month through the next 11 months." />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6">
          <Link href="/calendar" className="text-sm text-primary hover:underline">
            ← Month view
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {months.map((m) => (
            <MiniMonth key={`${m.year}-${m.month}`} year={m.year} month={m.month} eventDays={eventDays} />
          ))}
        </div>
      </div>
    </div>
  );
}
