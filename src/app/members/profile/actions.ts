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

  await prisma.memberProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      address: str(formData.get("address")),
      phone: str(formData.get("phone")),
      publicEmail: str(formData.get("publicEmail")),
      children: str(formData.get("children")),
      pets: str(formData.get("pets")),
      interests: str(formData.get("interests")),
      workInfo: str(formData.get("workInfo")),
      showInDirectory: formData.get("showInDirectory") === "on",
      photoUrl,
    },
    update: {
      address: str(formData.get("address")),
      phone: str(formData.get("phone")),
      publicEmail: str(formData.get("publicEmail")),
      children: str(formData.get("children")),
      pets: str(formData.get("pets")),
      interests: str(formData.get("interests")),
      workInfo: str(formData.get("workInfo")),
      showInDirectory: formData.get("showInDirectory") === "on",
      ...(photoUrl ? { photoUrl } : {}),
    },
  });

  revalidatePath("/members/profile");
  revalidatePath("/members/directory");
  return { success: true };
}
