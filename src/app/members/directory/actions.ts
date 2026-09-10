"use server";

import { prisma } from "@/lib/prisma";
import { requireApprovedUser } from "@/lib/authz";
import { sendMail } from "@/lib/mailer";

export type MessageState = { error?: string; success?: boolean } | undefined;

export async function sendMemberMessageAction(
  recipientId: string,
  _prev: MessageState,
  formData: FormData
): Promise<MessageState> {
  const sender = await requireApprovedUser();
  const message = String(formData.get("message") || "").trim();
  if (!message) return { error: "Please write a message." };
  if (recipientId === sender.id) return { error: "You can't message yourself." };

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient || recipient.status !== "APPROVED") return { error: "That member could not be found." };

  await sendMail({
    to: recipient.email,
    subject: `Message from ${sender.name} via the JMPHOA website`,
    text: `${sender.name} (${sender.email}) sent you a message through the John Mitchell Preserve HOA member directory:\n\n${message}\n\nYou can reply directly to this email to respond.`,
    replyTo: sender.email ?? undefined,
  });

  return { success: true };
}
