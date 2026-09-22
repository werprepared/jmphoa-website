import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { zonedDateFromParts } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CalendarDayPage({ params }: { params: Promise<{ date: string }> }) {
  await requireApprovedUser();
  const { date } = await params;

  const [year, month, day] = date.split("-").map(Number);
  const rangeStart = zonedDateFromParts(year, month, day);
  const rangeEnd = zonedDateFromParts(year, month, day + 1);

  const events = await prisma.calendarEvent.findMany({
    where: { startsAt: { gte: rangeStart, lt: rangeEnd } },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div>
      <PageHeader title={format(rangeStart, "EEEE, MMMM d, yyyy")} subtitle="Events on this day" />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
        <Link href="/calendar" className="text-sm text-primary hover:underline">
          ← Back to calendar
        </Link>

        {events.length === 0 ? (
          <p className="text-muted">No events scheduled on this day.</p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {events.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3 bg-card">
                <div>
                  <div className="font-medium text-navy">{e.title}</div>
                  <div className="text-sm text-muted">
                    {format(e.startsAt, "MMM d, yyyy")} · {e.allDay ? "All day" : format(e.startsAt, "h:mm a")}
                    {e.location ? ` · ${e.location}` : ""}
                  </div>
                </div>
                <Link href={`/calendar/${e.id}`} className="text-primary text-sm font-medium hover:underline shrink-0">
                  View
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
