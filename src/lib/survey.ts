import type { SurveyVote } from "@prisma/client";

export const SURVEY_VOTE_OPTIONS: { value: SurveyVote; label: string; points: number }[] = [
  { value: "STRONGLY_AGREE", label: "Strongly Agree", points: 5 },
  { value: "AGREE", label: "Agree", points: 4 },
  { value: "DISAGREE", label: "Disagree", points: -2 },
  { value: "STRONGLY_DISAGREE", label: "Strongly Disagree", points: -3 },
  { value: "UNSURE", label: "I don't know", points: 0 },
];

export const SURVEY_VOTE_LABELS: Record<SurveyVote, string> = Object.fromEntries(
  SURVEY_VOTE_OPTIONS.map((o) => [o.value, o.label])
) as Record<SurveyVote, string>;

/** Short axis labels for the compact results bar chart. */
export const SURVEY_VOTE_SHORT_LABELS: Record<SurveyVote, string> = {
  STRONGLY_AGREE: "SA",
  AGREE: "A",
  DISAGREE: "D",
  STRONGLY_DISAGREE: "SD",
  UNSURE: "?",
};

/** Diverging color per response, so agreement (green) and disagreement (red) read at a glance. */
export const SURVEY_VOTE_COLORS: Record<SurveyVote, string> = {
  STRONGLY_AGREE: "bg-green-600",
  AGREE: "bg-green-300",
  DISAGREE: "bg-red-300",
  STRONGLY_DISAGREE: "bg-red-600",
  UNSURE: "bg-gray-400",
};

export const SURVEY_VOTE_POINTS: Record<SurveyVote, number> = Object.fromEntries(
  SURVEY_VOTE_OPTIONS.map((o) => [o.value, o.points])
) as Record<SurveyVote, number>;

export function isSurveyVote(value: unknown): value is SurveyVote {
  return typeof value === "string" && value in SURVEY_VOTE_POINTS;
}
