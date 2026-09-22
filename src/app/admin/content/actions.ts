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
  revalidatePath("/members/faq");
}

export async function deleteFaqAction(id: string) {
  await requireRole("ADMIN");
  await prisma.faqItem.delete({ where: { id } });
  revalidatePath("/admin/content/faq");
  revalidatePath("/members/faq");
}

// --- Sponsors ---
export async function addSponsorAction(formData: FormData) {
  await requireRole("ADMIN");
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      logoUrl = await saveImage(logo);
    } catch (err) {
      console.error("Sponsor logo upload failed:", err);
    }
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

// --- Community Categories ---
export async function addCommunityCategoryAction(name: string) {
  await requireRole("ADMIN");
  const trimmed = name.trim();
  if (!trimmed) return;
  const count = await prisma.communityCategory.count();
  await prisma.communityCategory.create({ data: { name: trimmed, sortOrder: count } });
  revalidatePath("/admin/content/community-categories");
  revalidatePath("/members/community");
}

export async function renameCommunityCategoryAction(id: string, name: string) {
  await requireRole("ADMIN");
  const trimmed = name.trim();
  if (!trimmed) return;
  await prisma.communityCategory.update({ where: { id }, data: { name: trimmed } });
  revalidatePath("/admin/content/community-categories");
  revalidatePath("/members/community");
}

export async function deleteCommunityCategoryAction(id: string) {
  await requireRole("ADMIN");
  await prisma.communityCategory.delete({ where: { id } });
  revalidatePath("/admin/content/community-categories");
  revalidatePath("/members/community");
}

export async function moveCommunityCategoryAction(id: string, direction: "up" | "down") {
  await requireRole("ADMIN");
  const categories = await prisma.communityCategory.findMany({ orderBy: { sortOrder: "asc" } });
  const idx = categories.findIndex((c) => c.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx === -1 || swapIdx < 0 || swapIdx >= categories.length) return;

  const a = categories[idx];
  const b = categories[swapIdx];
  await prisma.$transaction([
    prisma.communityCategory.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.communityCategory.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidatePath("/admin/content/community-categories");
  revalidatePath("/members/community");
}

// --- Board positions ---
export async function addBoardPositionAction(title: string) {
  await requireRole("ADMIN");
  const count = await prisma.boardPosition.count();
  await prisma.boardPosition.create({ data: { title, sortOrder: count } });
  revalidatePath("/admin/content/board");
  revalidatePath("/members/board");
}

export async function assignBoardPositionAction(id: string, userId: string) {
  await requireRole("ADMIN");
  await prisma.boardPosition.update({ where: { id }, data: { userId: userId || null } });
  revalidatePath("/admin/content/board");
  revalidatePath("/members/board");
}

export async function deleteBoardPositionAction(id: string) {
  await requireRole("ADMIN");
  await prisma.boardPosition.delete({ where: { id } });
  revalidatePath("/admin/content/board");
  revalidatePath("/members/board");
}
