"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApprovedUser } from "@/lib/authz";
import { saveImage, saveDocument, UploadError } from "@/lib/upload";
import { richTextIsEmpty } from "@/lib/richtext";

export type PostState = { error?: string } | undefined;

export async function createPostAction(_prev: PostState, formData: FormData): Promise<PostState> {
  const user = await requireApprovedUser();
  const categoryId = String(formData.get("categoryId") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!categoryId) return { error: "Please choose a category." };
  if (richTextIsEmpty(body)) return { error: "Please write something to post." };

  const category = await prisma.communityCategory.findUnique({ where: { id: categoryId } });
  if (!category) return { error: "Please choose a valid category." };

  let imageUrl: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    try {
      imageUrl = await saveImage(photo);
    } catch (err) {
      if (err instanceof UploadError) return { error: err.message };
      throw err;
    }
  }

  await prisma.communityPost.create({ data: { authorId: user.id, categoryId, body, imageUrl } });
  revalidatePath("/members/community");
}

export async function createCommentAction(postId: string, formData: FormData) {
  const user = await requireApprovedUser();
  const body = String(formData.get("body") || "").trim();
  if (!body) return;

  let fileUrl: string | undefined;
  let fileName: string | undefined;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    try {
      fileUrl = await saveDocument(file);
      fileName = file.name;
    } catch (err) {
      console.error("Community comment attachment upload failed:", err);
    }
  }

  await prisma.communityComment.create({ data: { postId, authorId: user.id, body, fileUrl, fileName } });
  revalidatePath("/members/community");
}

export async function deletePostAction(postId: string) {
  const user = await requireApprovedUser();
  const post = await prisma.communityPost.findUnique({ where: { id: postId } });
  if (!post) return;
  if (post.authorId !== user.id && !user.roles.includes("ADMIN")) return;
  await prisma.communityPost.delete({ where: { id: postId } });
  revalidatePath("/members/community");
}
