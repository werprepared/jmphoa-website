import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";
import NewSurveyForm from "./NewSurveyForm";
import SurveyCard from "./SurveyCard";

export const dynamic = "force-dynamic";

export default async function SurveyPage() {
  const user = await requireApprovedUser();
  const canDelete = isAdmin(user.roles);

  const [surveys, members] = await Promise.all([
    prisma.survey.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: true,
        responses: { include: { user: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.user.findMany({ where: { status: "APPROVED" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Survey / Feedback" subtitle="Create a poll or share your feedback on community topics." />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <NewSurveyForm members={members} />

        {surveys.length === 0 ? (
          <p className="text-muted text-center">No surveys yet. Be the first to create one!</p>
        ) : (
          <div className="space-y-6">
            {surveys.map((survey) => {
              const myResponse = survey.responses.find((r) => r.userId === user.id) ?? null;
              return (
                <SurveyCard
                  key={survey.id}
                  survey={{
                    id: survey.id,
                    title: survey.title,
                    description: survey.description,
                    attachmentUrl: survey.attachmentUrl,
                    attachmentName: survey.attachmentName,
                    createdByName: survey.createdBy.name,
                    responses: survey.responses.map((r) => ({
                      id: r.id,
                      voterName: r.user.name,
                      vote: r.vote,
                      points: r.points,
                      comment: r.comment,
                    })),
                  }}
                  myResponse={myResponse ? { vote: myResponse.vote, comment: myResponse.comment } : null}
                  canDelete={canDelete}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
