import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { saveEventAction, deleteEventAction, deleteEventAttachmentAction } from "./actions";
import NotifyMembersField from "@/components/NotifyMembersField";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

function toLocalInput(d: Date) {
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireRole("ADMIN", "BOARD_MEMBER", "COMMITTEE_ARCH", "COMMITTEE_SOCIAL");
  const { edit } = await searchParams;

  const [events, editing, members] = await Promise.all([
    prisma.calendarEvent.findMany({ orderBy: { startsAt: "asc" }, include: { attachments: true } }),
    edit ? prisma.calendarEvent.findUnique({ where: { id: edit }, include: { attachments: true } }) : null,
    prisma.user.findMany({ where: { status: "APPROVED" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">Calendar</h1>

      <form action={saveEventAction} className="bg-card border border-border rounded-lg p-5 space-y-3">
        <h2 className="font-semibold text-navy text-sm">{editing ? "Edit event" : "New event"}</h2>
        <input type="hidden" name="id" value={editing?.id || ""} />
        <input name="title" placeholder="Title" required defaultValue={editing?.title || ""} className="w-full border border-border rounded px-3 py-2 text-sm" />
        <textarea name="description" placeholder="Description (optional)" defaultValue={editing?.description || ""} rows={2} className="w-full border border-border rounded px-3 py-2 text-sm" />
        <input name="location" placeholder="Location (optional)" defaultValue={editing?.location || ""} className="w-full border border-border rounded px-3 py-2 text-sm" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-muted mb-1">Starts</label>
            <input
              type="datetime-local"
              name="startsAt"
              required
              defaultValue={editing ? toLocalInput(editing.startsAt) : ""}
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Ends (optional)</label>
            <input
              type="datetime-local"
              name="endsAt"
              defaultValue={editing?.endsAt ? toLocalInput(editing.endsAt) : ""}
              className="w-full border border-border rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="allDay" defaultChecked={editing?.allDay} /> All day event
        </label>
        <div>
          <label className="block text-xs text-muted mb-1">Attach documents (optional)</label>
          <input
            type="file"
            name="attachments"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png"
            className="text-sm"
          />
        </div>

        {!editing && <NotifyMembersField members={members} />}
        <div className="flex gap-2">
          <button className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors">
            {editing ? "Save changes" : "Create event"}
          </button>
          {editing && (
            <Link href="/admin/calendar" className="text-sm text-muted px-4 py-2 hover:underline">
              Cancel
            </Link>
          )}
        </div>
      </form>

      {editing && editing.attachments.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5 -mt-3">
          <label className="block text-xs text-muted mb-2">Current attachments on this event</label>
          <ul className="space-y-1">
            {editing.attachments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 text-sm bg-white border border-border rounded px-3 py-1.5">
                <a href={a.fileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">
                  📎 {a.fileName}
                </a>
                <form action={async () => { "use server"; await deleteEventAttachmentAction(a.id); }}>
                  <button className="text-xs text-muted hover:text-red-600 shrink-0">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
        {events.map((e) => (
          <li key={e.id} className="flex items-center justify-between px-4 py-3 bg-card gap-4">
            <div>
              <div className="font-medium text-navy">{e.title}</div>
              <div className="text-xs text-muted">
                {format(e.startsAt, "MMM d, yyyy")} · {e.allDay ? "All day" : format(e.startsAt, "h:mm a")}
                {e.location ? ` · ${e.location}` : ""}
                {e.attachments.length > 0 ? ` · 📎 ${e.attachments.length}` : ""}
              </div>
            </div>
            <div className="flex gap-3 shrink-0">
              <Link href={`/admin/calendar?edit=${e.id}`} className="text-xs text-primary hover:underline">
                Edit
              </Link>
              <form action={async () => { "use server"; await deleteEventAction(e.id); }}>
                <button className="text-xs text-muted hover:text-red-600">Delete</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
