"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { SITE_URL } from "@/lib/notify";

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export type LoginState = { error?: string } | undefined;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const callbackUrl = String(formData.get("callbackUrl") || "/members");

  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw err;
  }
}

const registerSchema = z.object({
  name: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  address: z.string().min(3, "Please enter your address."),
});

export type RegisterState = { error?: string; success?: boolean } | undefined;

export async function registerAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    address: formData.get("address"),
  });

  if (!parsed.success) {
    return { error: parsed.data ? "Invalid input." : parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { name, email, password, address } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      passwordHash,
      status: "PENDING",
      roles: { create: { role: "MEMBER" } },
      profile: { create: { address } },
    },
  });

  const boardEmail = process.env.BOARD_EMAIL || "JMPHOAboard@gmail.com";
  await sendMail({
    to: boardEmail,
    subject: "New JMPHOA member registration pending approval",
    text: `${name} (${normalizedEmail}) has requested to join the JMPHOA website and is awaiting approval in the Admin > Users panel.`,
  });

  return { success: true };
}

export type ForgotPasswordState = { success?: boolean; error?: string } | undefined;

export async function requestPasswordResetAction(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") || "").toLowerCase().trim();
  if (!email) return { error: "Please enter your email." };

  const user = await prisma.user.findUnique({ where: { email } });

  // Always report success, even if no account exists, so this can't be used to check
  // who's registered.
  if (user) {
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpiry } });

    await sendMail({
      to: user.email,
      subject: "Reset your JMPHOA website password",
      text: `Hi ${user.name},\n\nSomeone requested a password reset for your John Mitchell Preserve HOA website account. Click the link below to choose a new password (this link expires in 1 hour):\n\n${SITE_URL}/reset-password?token=${resetToken}\n\nIf you didn't request this, you can safely ignore this email.`,
    });
  }

  return { success: true };
}

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordState = { success?: boolean; error?: string } | undefined;

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your entries." };
  }

  const { token, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { resetToken: token } });

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return { error: "This reset link is invalid or has expired. Please request a new one." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiry: null },
  });

  return { success: true };
}
