"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { deleteUnreferencedBlobs } from "@/lib/blob-usage";

export async function deleteAllUnreferencedAction() {
  await requireRole("ADMIN");
  await deleteUnreferencedBlobs();
  revalidatePath("/admin/storage");
}

export async function deleteOneUnreferencedAction(pathname: string) {
  await requireRole("ADMIN");
  await deleteUnreferencedBlobs({ only: [pathname] });
  revalidatePath("/admin/storage");
}
