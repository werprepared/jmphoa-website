"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireApprovedUser } from "@/lib/authz";

export type SurveyState = { error?: string; success?: boolean } | undefined;

export async function submitSurveyAction(_prev: SurveyState, formData: FormData): Promise<SurveyState> {
  const user = await requireApprovedUser();

  const existing = await prisma.surveyResponse.findUnique({ where: { userId: user.id } });
  if (existing) return { error: "You've already submitted a response. Thank you!" };

  const questions = await prisma.surveyQuestion.findMany({ where: { active: true } });
  if (questions.length === 0) return { error: "There is no active survey right now." };

  await prisma.surveyResponse.create({
    data: {
      userId: user.id,
      answers: {
        create: questions.map((q) => ({
          questionId: q.id,
          value: String(formData.get(`q_${q.id}`) || ""),
        })),
      },
    },
  });

  revalidatePath("/members/survey");
  return { success: true };
}
