"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApprovedUser } from "@/lib/authz";
import { uploadableCategoriesForRole } from "@/lib/roles";
import { saveDocument, UploadError } from "@/lib/upload";
import { notifyMembers, readNotifyChoice, SITE_URL } from "@/lib/notify";
import type { DocCategory } from "@prisma/client";

async function assertCategoryAllowed(category: DocCategory) {
  const user = await requireApprovedUser();
  const allowed = uploadableCategoriesForRole(user.roles);
  if (!allowed.includes(category)) {
    throw new Error("You don't have permission to manage documents in that category.");
  }
  return user;
}

export async function createFolderAction(formData: FormData) {
  const category = formData.get("category") as DocCategory;
  const user = await assertCategoryAllowed(category);
  const name = String(formData.get("name") || "").trim();
  const parentId = String(formData.get("parentId") || "") || null;
  if (!name) return;

  const count = await prisma.folder.count({ where: { parentId } });
  await prisma.folder.create({ data: { name, parentId, category, sortOrder: count } });

  revalidatePath("/admin/documents");
  revalidatePath("/members/documents");
  void user;
}

export type UploadDocState = { error?: string } | undefined;

export async function uploadDocumentAction(_prev: UploadDocState, formData: FormData): Promise<UploadDocState> {
  const category = formData.get("category") as DocCategory;
  const user = await assertCategoryAllowed(category);

  const title = String(formData.get("title") || "").trim();
  const folderId = String(formData.get("folderId") || "") || null;
  const file = formData.get("file");

  if (!title) return { error: "Please enter a document title." };
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose a file." };

  try {
    const fileUrl = await saveDocument(file);
    await prisma.document.create({
      data: { title, fileUrl, fileType: file.type, category, folderId, uploadedById: user.id },
    });
  } catch (err) {
    if (err instanceof UploadError) return { error: err.message };
    throw err;
  }

  const { scope, userIds } = readNotifyChoice(formData);
  await notifyMembers({
    scope,
    userIds,
    subject: `New document: ${title}`,
    text: `${user.name} added a new document, "${title}", to the John Mitchell Preserve HOA website.\n\nView it at: ${SITE_URL}/members/documents`,
  });

  revalidatePath("/admin/documents");
  revalidatePath("/members/documents");
}

export async function renameFolderAction(id: string, name: string) {
  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder) return;
  await assertCategoryAllowed(folder.category);

  const trimmed = name.trim();
  if (!trimmed) return;

  await prisma.folder.update({ where: { id }, data: { name: trimmed } });
  revalidatePath("/admin/documents");
  revalidatePath("/members/documents");
}

export async function renameDocumentAction(id: string, title: string) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return;
  await assertCategoryAllowed(doc.category);

  const trimmed = title.trim();
  if (!trimmed) return;

  await prisma.document.update({ where: { id }, data: { title: trimmed } });
  revalidatePath("/admin/documents");
  revalidatePath("/members/documents");
}

export async function deleteDocumentAction(id: string) {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return;
  await assertCategoryAllowed(doc.category);
  await prisma.document.delete({ where: { id } });
  revalidatePath("/admin/documents");
  revalidatePath("/members/documents");
}

export async function deleteFolderAction(id: string) {
  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder) return;
  await assertCategoryAllowed(folder.category);
  await prisma.folder.delete({ where: { id } });
  revalidatePath("/admin/documents");
  revalidatePath("/members/documents");
}
