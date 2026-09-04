"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { saveImage, UploadError } from "@/lib/upload";

function str(v: FormDataEntryValue | null) {
  const s = (v ?? "").toString();
  return s.length ? s : null;
}

export type ContentState = { error?: string; success?: boolean } | undefined;

export async function savePageContentAction(key: string, _prev: ContentState, formData: FormData): Promise<ContentState> {
  await requireRole("ADMIN");

  let imageUrl: string | undefined;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    try {
      imageUrl = await saveImage(image);
    } catch (err) {
      if (err instanceof UploadError) return { error: err.message };
      throw err;
    }
  }

  await prisma.pageContent.upsert({
    where: { key },
    create: {
      key,
      title: str(formData.get("title")),
      body: str(formData.get("body")),
      imageUrl,
    },
    update: {
      title: str(formData.get("title")),
      body: str(formData.get("body")),
      ...(imageUrl ? { imageUrl } : {}),
    },
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath(`/admin/content/${key.split("_")[0]}`);
  return { success: true };
}

// --- FAQ ---
export async function addFaqAction(question: string, answer: string) {
  await requireRole("ADMIN");
  const count = await prisma.faqItem.count();
  await prisma.faqItem.create({ data: { question, answer, sortOrder: count } });
  revalidatePath("/admin/content/faq");
  revalidatePath("/about/faq");
}

export async function deleteFaqAction(id: string) {
  await requireRole("ADMIN");
  await prisma.faqItem.delete({ where: { id } });
  revalidatePath("/admin/content/faq");
  revalidatePath("/about/faq");
}

// --- Sponsors ---
export async function addSponsorAction(formData: FormData) {
  await requireRole("ADMIN");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    logoUrl = await saveImage(logo);
  }

  const count = await prisma.sponsor.count();
  await prisma.sponsor.create({
    data: {
      name,
      blurb: str(formData.get("blurb")),
      linkUrl: str(formData.get("linkUrl")),
      logoUrl,
      sortOrder: count,
    },
  });
  revalidatePath("/admin/content/sponsors");
  revalidatePath("/about/sponsors");
  revalidatePath("/");
}

export async function deleteSponsorAction(id: string) {
  await requireRole("ADMIN");
  await prisma.sponsor.delete({ where: { id } });
  revalidatePath("/admin/content/sponsors");
  revalidatePath("/about/sponsors");
  revalidatePath("/");
}

// --- Board positions ---
export async function addBoardPositionAction(title: string) {
  await requireRole("ADMIN");
  const count = await prisma.boardPosition.count();
  await prisma.boardPosition.create({ data: { title, sortOrder: count } });
  revalidatePath("/admin/content/board");
  revalidatePath("/about/board");
}

export async function assignBoardPositionAction(id: string, userId: string) {
  await requireRole("ADMIN");
  await prisma.boardPosition.update({ where: { id }, data: { userId: userId || null } });
  revalidatePath("/admin/content/board");
  revalidatePath("/about/board");
}

export async function deleteBoardPositionAction(id: string) {
  await requireRole("ADMIN");
  await prisma.boardPosition.delete({ where: { id } });
  revalidatePath("/admin/content/board");
  revalidatePath("/about/board");
}
