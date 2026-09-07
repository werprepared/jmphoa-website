"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApprovedUser } from "@/lib/authz";
import { saveImage, UploadError } from "@/lib/upload";

export type PostState = { error?: string } | undefined;

export async function createPostAction(_prev: PostState, formData: FormData): Promise<PostState> {
  const user = await requireApprovedUser();
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!subject) return { error: "Please add a subject." };
  if (!body) return { error: "Please write something to post." };

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

  await prisma.communityPost.create({ data: { authorId: user.id, subject, body, imageUrl } });
  revalidatePath("/members/community");
}

export async function createCommentAction(postId: string, formData: FormData) {
  const user = await requireApprovedUser();
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  await prisma.communityComment.create({ data: { postId, authorId: user.id, body } });
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
