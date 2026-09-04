"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import type { ContactRecipient } from "@prisma/client";

const RECIPIENT_EMAILS: Record<ContactRecipient, string> = {
  BOARD: process.env.BOARD_EMAIL || "JMPHOAboard@gmail.com",
  ARCHITECTURE: process.env.ARCHITECTURE_EMAIL || "JMPHOArch@gmail.com",
  SOCIAL: process.env.SOCIAL_EMAIL || "JMPHOAsocial@gmail.com",
};

const schema = z.object({
  recipient: z.enum(["BOARD", "ARCHITECTURE", "SOCIAL"]),
  fromName: z.string().min(1, "Please enter your name."),
  fromEmail: z.string().email("Please enter a valid email."),
  message: z.string().min(5, "Please enter a message."),
});

export type ContactState = { error?: string; success?: boolean } | undefined;

export async function sendContactMessage(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = schema.safeParse({
    recipient: formData.get("recipient"),
    fromName: formData.get("fromName"),
    fromEmail: formData.get("fromEmail"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your entries." };
  }

  const { recipient, fromName, fromEmail, message } = parsed.data;

  await prisma.contactMessage.create({ data: { recipient, fromName, fromEmail, message } });

  await sendMail({
    to: RECIPIENT_EMAILS[recipient],
    subject: `JMPHOA website message from ${fromName}`,
    text: `From: ${fromName} <${fromEmail}>\n\n${message}`,
  });

  return { success: true };
}
