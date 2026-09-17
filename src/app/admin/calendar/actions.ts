"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { notifyMembers, readNotifyChoice, SITE_URL } from "@/lib/notify";
import { saveDocument } from "@/lib/upload";

async function saveEventAttachments(eventId: string, formData: FormData) {
  const files = formData.getAll("attachments");
  for (const file of files) {
    if (!(file instanceof File) || file.size === 0) continue;
    try {
      const fileUrl = await saveDocument(file);
      await prisma.eventAttachment.create({ data: { eventId, fileUrl, fileName: file.name } });
    } catch (err) {
      console.error("Event attachment upload failed:", err);
    }
  }
}

export async function saveEventAction(formData: FormData) {
  const user = await requireRole("ADMIN", "BOARD_MEMBER", "COMMITTEE_ARCH", "COMMITTEE_SOCIAL");

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const location = String(formData.get("location") || "").trim() || null;
  const startsAt = new Date(String(formData.get("startsAt")));
  const endsAtRaw = String(formData.get("endsAt") || "");
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;
  const allDay = formData.get("allDay") === "on";

  if (!title || isNaN(startsAt.getTime())) return;

  if (id) {
    await prisma.calendarEvent.update({ where: { id }, data: { title, description, location, startsAt, endsAt, allDay } });
    await saveEventAttachments(id, formData);
  } else {
    const event = await prisma.calendarEvent.create({
      data: { title, description, location, startsAt, endsAt, allDay, createdById: user.id },
    });
    await saveEventAttachments(event.id, formData);

    const { scope, userIds } = readNotifyChoice(formData);
    const when = allDay ? format(startsAt, "MMMM d, yyyy") : format(startsAt, "MMMM d, yyyy 'at' h:mm a");
    await notifyMembers({
      scope,
      userIds,
      subject: `New calendar event: ${title}`,
      text: `${user.name} added a new event to the John Mitchell Preserve HOA calendar:\n\n${title}\n${when}${location ? `\n${location}` : ""}${description ? `\n\n${description}` : ""}\n\nView the calendar: ${SITE_URL}/calendar`,
    });
  }

  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
  revalidatePath("/");
  redirect("/admin/calendar");
}

export async function deleteEventAction(id: string) {
  await requireRole("ADMIN", "BOARD_MEMBER", "COMMITTEE_ARCH", "COMMITTEE_SOCIAL");
  await prisma.calendarEvent.delete({ where: { id } });
  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
  revalidatePath("/");
}

export async function deleteEventAttachmentAction(id: string) {
  await requireRole("ADMIN", "BOARD_MEMBER", "COMMITTEE_ARCH", "COMMITTEE_SOCIAL");
  await prisma.eventAttachment.delete({ where: { id } });
  revalidatePath("/admin/calendar");
  revalidatePath("/calendar");
}
