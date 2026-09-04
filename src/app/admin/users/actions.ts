"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import type { Role } from "@prisma/client";
import { sendMail } from "@/lib/mailer";

export async function approveUserAction(userId: string) {
  await requireRole("ADMIN", "MEMBERSHIP_COORDINATOR");
  const target = await prisma.user.update({ where: { id: userId }, data: { status: "APPROVED" } });
  await sendMail({
    to: target.email,
    subject: "Your JMPHOA account has been approved",
    text: `Hi ${target.name}, your John Mitchell Preserve HOA website account has been approved. You can now log in at the site.`,
  });
  revalidatePath("/admin/users");
}

export async function rejectUserAction(userId: string) {
  await requireRole("ADMIN", "MEMBERSHIP_COORDINATOR");
  await prisma.user.update({ where: { id: userId }, data: { status: "REJECTED" } });
  revalidatePath("/admin/users");
}

export async function removeUserAction(userId: string) {
  const actor = await requireRole("ADMIN", "MEMBERSHIP_COORDINATOR");
  if (actor.id === userId) throw new Error("You can't remove your own account here.");
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}

export async function setUserRoleAction(userId: string, role: Role) {
  await requireRole("ADMIN");
  await prisma.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/admin/users");
}
