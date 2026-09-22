"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import type { Committee, Role } from "@prisma/client";
import { sendMail } from "@/lib/mailer";

const COMMITTEE_ROLES: { role: Role; committee: Committee }[] = [
  { role: "COMMITTEE_ARCH", committee: "ARCHITECTURE" },
  { role: "COMMITTEE_SOCIAL", committee: "SOCIAL" },
  { role: "COMMITTEE_LANDSCAPE", committee: "LANDSCAPE" },
];

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

  const target = await prisma.user.findUnique({ where: { id: userId }, include: { roles: true } });
  if (!target) return;
  if (target.roles.some((r) => r.role === "ADMIN")) {
    throw new Error("The Admin account can't be removed.");
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}

export async function setUserRolesAction(userId: string, roles: Role[]) {
  const actor = await requireRole("ADMIN", "MEMBERSHIP_COORDINATOR");
  if (actor.id === userId) throw new Error("You can't change your own roles here.");

  if (!actor.roles.includes("ADMIN")) {
    const target = await prisma.user.findUnique({ where: { id: userId }, include: { roles: true } });
    if (target?.roles.some((r) => r.role === "ADMIN")) {
      throw new Error("Only the Admin can change the Admin's roles.");
    }
  }

  // A user always needs at least one role; fall back to plain Member if none were selected.
  const uniqueRoles = [...new Set(roles.length > 0 ? roles : (["MEMBER"] as Role[]))];

  await prisma.$transaction([
    prisma.userRole.deleteMany({ where: { userId } }),
    prisma.userRole.createMany({ data: uniqueRoles.map((role) => ({ userId, role })) }),
  ]);

  // Keep the public Committee Members roster (a separate membership record, since it also
  // tracks chair status) in sync with the committee roles assigned here.
  for (const { role, committee } of COMMITTEE_ROLES) {
    if (uniqueRoles.includes(role)) {
      await prisma.committeeMembership.upsert({
        where: { userId_committee: { userId, committee } },
        create: { userId, committee, approved: true },
        update: { approved: true },
      });
    } else {
      await prisma.committeeMembership.deleteMany({ where: { userId, committee } });
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/committees");
  revalidatePath("/members/committees");
}
