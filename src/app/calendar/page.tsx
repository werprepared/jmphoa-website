import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { format, isSameMonth } from "date-fns";
import { auth } from "@/auth";
import { canManageCalendar } from "@/lib/roles";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const session = await auth();
  const events = await prisma.calendarEvent.findMany({
    where: { startsAt: { gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) } },
    orderBy: { startsAt: "asc" },
  });

  const groups: { month: string; events: typeof events }[] = [];
  for (const e of events) {
    const label = format(e.startsAt, "MMMM yyyy");
    let group = groups.find((g) => g.month === label);
    if (!group) {
      group = { month: label, events: [] };
      groups.push(group);
    }
    group.events.push(e);
  }

  return (
    <div>
      <PageHeader title="Community Calendar" subtitle="Board meetings, social events, and neighborhood happenings." />
      <div className="max-w-4xl mx-auto px-4 py-10">
        {session?.user && canManageCalendar(session.user.roles) && (
          <div className="mb-6 text-right">
            <Link href="/admin/calendar" className="text-primary font-medium hover:underline text-sm">
              Manage events →
            </Link>
          </div>
        )}
        {groups.length === 0 && <p className="text-muted">No events scheduled yet.</p>}
        {groups.map((group) => (
          <div key={group.month} className="mb-8">
            <h2 className="text-lg font-semibold text-navy mb-3 border-b border-border pb-2">
              {group.month}
              {isSameMonth(new Date(), new Date(group.events[0].startsAt)) && (
                <span className="ml-2 text-xs bg-gold text-navy px-2 py-0.5 rounded-full align-middle">This month</span>
              )}
            </h2>
            <ul className="space-y-3">
              {group.events.map((e) => (
                <li key={e.id} className="flex gap-4 bg-card border border-border rounded-lg p-4">
                  <div className="w-16 shrink-0 text-center">
                    <div className="text-xs uppercase text-primary font-semibold">{format(e.startsAt, "MMM")}</div>
                    <div className="text-2xl font-bold text-navy">{format(e.startsAt, "d")}</div>
                  </div>
                  <div>
                    <div className="font-medium text-navy">{e.title}</div>
                    <div className="text-sm text-muted">
                      {e.allDay ? "All day" : format(e.startsAt, "h:mm a")}
                      {e.location ? ` · ${e.location}` : ""}
                    </div>
                    {e.description && <p className="text-sm text-muted mt-1">{e.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
