"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApprovedUser } from "@/lib/authz";
import { isAdmin } from "@/lib/roles";
import { SURVEY_VOTE_POINTS, isSurveyVote } from "@/lib/survey";
import { saveDocument, UploadError } from "@/lib/upload";
import { notifyMembers, readNotifyChoice, SITE_URL } from "@/lib/notify";

export type SurveyState = { error?: string } | undefined;

export async function createSurveyAction(_prev: SurveyState, formData: FormData): Promise<SurveyState> {
  const user = await requireApprovedUser();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  if (!title) return { error: "Please give the survey a title." };

  let attachmentUrl: string | undefined;
  let attachmentName: string | undefined;
  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    try {
      attachmentUrl = await saveDocument(file);
      attachmentName = file.name;
    } catch (err) {
      if (err instanceof UploadError) return { error: err.message };
      throw err;
    }
  }

  await prisma.survey.create({
    data: { title, description: description || null, createdById: user.id, attachmentUrl, attachmentName },
  });

  const { scope, userIds } = readNotifyChoice(formData);
  await notifyMembers({
    scope,
    userIds,
    subject: `New survey: ${title}`,
    text: `${user.name} created a new survey on the John Mitchell Preserve HOA website:\n\n${title}${description ? `\n${description}` : ""}\n\nRespond here: ${SITE_URL}/members/survey`,
  });

  revalidatePath("/members/survey");
}

export async function submitVoteAction(surveyId: string, _prev: SurveyState, formData: FormData): Promise<SurveyState> {
  const user = await requireApprovedUser();
  const vote = formData.get("vote");
  const comment = String(formData.get("comment") || "").trim();

  if (!isSurveyVote(vote)) return { error: "Please choose a response." };

  await prisma.surveyResponse.upsert({
    where: { surveyId_userId: { surveyId, userId: user.id } },
    create: { surveyId, userId: user.id, vote, points: SURVEY_VOTE_POINTS[vote], comment: comment || null },
    update: { vote, points: SURVEY_VOTE_POINTS[vote], comment: comment || null },
  });

  revalidatePath("/members/survey");
}

export async function deleteSurveyAction(surveyId: string) {
  const user = await requireApprovedUser();
  if (!isAdmin(user.roles)) throw new Error("Only the Admin can delete a survey.");

  await prisma.survey.delete({ where: { id: surveyId } });
  revalidatePath("/members/survey");
}

export async function deleteResponseAction(responseId: string) {
  const user = await requireApprovedUser();
  if (!isAdmin(user.roles)) throw new Error("Only the Admin can delete a response.");

  await prisma.surveyResponse.delete({ where: { id: responseId } });
  revalidatePath("/members/survey");
}
