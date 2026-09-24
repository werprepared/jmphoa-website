"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/authz";

/** Records a page view for the current signed-in, approved user. Silently does nothing otherwise. */
export async function recordPageViewAction(path: string) {
  const user = await getCurrentUser();
  if (!user || user.status !== "APPROVED") return;
  await prisma.pageView.create({ data: { userId: user.id, path } });
}
