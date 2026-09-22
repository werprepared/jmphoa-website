"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export async function approveCommitteeRequestAction(id: string) {
  await requireRole("ADMIN");
  await prisma.committeeMembership.update({ where: { id }, data: { approved: true } });
  revalidatePath("/admin/committees");
  revalidatePath("/members/committees");
}

export async function removeCommitteeMemberAction(id: string) {
  await requireRole("ADMIN");
  await prisma.committeeMembership.delete({ where: { id } });
  revalidatePath("/admin/committees");
  revalidatePath("/members/committees");
}

export async function setCommitteeChairAction(id: string, isChair: boolean) {
  await requireRole("ADMIN");
  await prisma.committeeMembership.update({ where: { id }, data: { role: isChair ? "CHAIR" : "MEMBER" } });
  revalidatePath("/admin/committees");
  revalidatePath("/members/committees");
}
