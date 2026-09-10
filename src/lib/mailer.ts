import nodemailer from "nodemailer";

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT ?? 587) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

/**
 * Sends an email if SMTP_* env vars are configured; otherwise logs it.
 * Callers should still persist the underlying message to the database so
 * nothing is lost while email isn't configured yet.
 */
export async function sendMail(opts: { to: string; subject: string; text: string; replyTo?: string }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[mailer] SMTP not configured - would send to ${opts.to}: ${opts.subject}\n${opts.text}`);
    return { sent: false as const };
  }
  await t.sendMail({
    from: process.env.SMTP_FROM || "JMPHOA Website <no-reply@jmphoa.org>",
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    replyTo: opts.replyTo,
  });
  return { sent: true as const };
}
