import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import SurveyForm from "./SurveyForm";

export const dynamic = "force-dynamic";

export default async function SurveyPage() {
  const user = await requireApprovedUser();
  const [questions, existing] = await Promise.all([
    prisma.surveyQuestion.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.surveyResponse.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <div>
      <PageHeader title="Survey / Feedback" subtitle="Help shape decisions for our community." />
      <div className="max-w-xl mx-auto px-4 py-10">
        {questions.length === 0 ? (
          <p className="text-muted">There&apos;s no active survey right now. Check back later.</p>
        ) : existing ? (
          <p className="text-primary font-medium">You&apos;ve already submitted a response. Thank you!</p>
        ) : (
          <SurveyForm questions={questions} />
        )}
      </div>
    </div>
  );
}
