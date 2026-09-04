"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApprovedUser } from "@/lib/authz";
import type { Committee } from "@prisma/client";

export async function requestJoinCommittee(committee: Committee) {
  const user = await requireApprovedUser();

  await prisma.committeeMembership.upsert({
    where: { userId_committee: { userId: user.id, committee } },
    create: { userId: user.id, committee, approved: false },
    update: {},
  });

  revalidatePath("/members/committees");
}
