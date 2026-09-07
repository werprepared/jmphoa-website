import "server-only";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

export const SITE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

export type NotifyScope = "all" | "selected" | "none";

/** Reads the notify-field's submitted scope/recipients out of a create-form's FormData. */
export function readNotifyChoice(formData: FormData): { scope: NotifyScope; userIds: string[] } {
  const scope = (String(formData.get("notifyScope") || "none") as NotifyScope) ?? "none";
  const userIds = formData.getAll("notifyUserIds").map(String);
  return { scope, userIds };
}

/** Emails approved members (all, or a specific subset) about something new on the site. */
export async function notifyMembers({
  scope,
  userIds,
  subject,
  text,
}: {
  scope: NotifyScope;
  userIds?: string[];
  subject: string;
  text: string;
}) {
  if (scope === "none") return;

  const recipients = await prisma.user.findMany({
    where:
      scope === "all"
        ? { status: "APPROVED" }
        : { status: "APPROVED", id: { in: userIds && userIds.length > 0 ? userIds : ["__none__"] } },
    select: { email: true },
  });

  await Promise.all(recipients.map((r) => sendMail({ to: r.email, subject, text })));
}
