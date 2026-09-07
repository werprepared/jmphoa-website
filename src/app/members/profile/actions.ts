"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApprovedUser } from "@/lib/authz";
import { saveImage, UploadError } from "@/lib/upload";

export type ProfileState = { error?: string; success?: boolean } | undefined;

function str(v: FormDataEntryValue | null) {
  const s = (v ?? "").toString().trim();
  return s.length ? s : null;
}

export type MemberMatch = { id: string; name: string };

/** Live search of other approved members by name, for the spouse-link autocomplete. */
export async function searchMembersAction(query: string): Promise<MemberMatch[]> {
  const user = await requireApprovedUser();
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const candidates = await prisma.user.findMany({
    where: { status: "APPROVED", id: { not: user.id } },
    select: { id: true, name: true },
  });

  return candidates.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 8);
}

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await requireApprovedUser();

  let photoUrl: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await saveImage(photo);
    } catch (err) {
      if (err instanceof UploadError) return { error: err.message };
      throw err;
    }
  }

  // Only trust a submitted spouseId if it's really a linkable approved member (not tampered with, not yourself).
  const submittedSpouseId = str(formData.get("spouseId"));
  let spouseId: string | null = null;
  if (submittedSpouseId && submittedSpouseId !== user.id) {
    const spouse = await prisma.user.findUnique({ where: { id: submittedSpouseId } });
    if (spouse && spouse.status === "APPROVED") spouseId = spouse.id;
  }

  const data = {
    address: str(formData.get("address")),
    phone: str(formData.get("phone")),
    publicEmail: str(formData.get("publicEmail")),
    children: str(formData.get("children")),
    pets: str(formData.get("pets")),
    interests: str(formData.get("interests")),
    workInfo: str(formData.get("workInfo")),
    showInDirectory: formData.get("showInDirectory") === "on",
    spouseName: str(formData.get("spouseName")),
    spouseId,
  };

  await prisma.memberProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data, photoUrl },
    update: { ...data, ...(photoUrl ? { photoUrl } : {}) },
  });

  revalidatePath("/members/profile");
  revalidatePath("/members/directory");
  return { success: true };
}
