import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { localDateKey } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  await requireApprovedUser();
  const { eventId } = await params;

  const event = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
    include: { attachments: true },
  });
  if (!event) notFound();

  return (
    <div>
      <PageHeader title={event.title} subtitle="Calendar Event" />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <Link href={`/calendar/day/${localDateKey(event.startsAt)}`} className="text-sm text-primary hover:underline">
          ← Back to that day
        </Link>

        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">Date</div>
            <div className="text-navy">{format(event.startsAt, "EEEE, MMMM d, yyyy")}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted">Time</div>
            <div className="text-navy">
              {event.allDay
                ? "All day"
                : event.endsAt
                  ? `${format(event.startsAt, "h:mm a")} - ${format(event.endsAt, "h:mm a")}`
                  : format(event.startsAt, "h:mm a")}
            </div>
          </div>
          {event.location && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted">Location</div>
              <div className="text-navy">{event.location}</div>
            </div>
          )}
          {event.description && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted">Description</div>
              <p className="text-navy whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
        </div>

        {event.attachments.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-2">
            <h2 className="font-semibold text-navy text-sm">Documents</h2>
            <ul className="space-y-1">
              {event.attachments.map((a) => (
                <li key={a.id}>
                  <a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                    📎 {a.fileName}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
