"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";

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
      role: "MEMBER",
      status: "PENDING",
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
