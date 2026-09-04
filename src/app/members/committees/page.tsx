import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { requestJoinCommittee } from "./actions";

export const dynamic = "force-dynamic";

const COMMITTEES = [
  {
    key: "ARCHITECTURE" as const,
    label: "Architecture Committee",
    desc: "Reviews home exterior modification requests and helps maintain neighborhood standards.",
  },
  {
    key: "SOCIAL" as const,
    label: "Social Committee",
    desc: "Plans community events, gatherings, and neighborhood get-togethers.",
  },
];

export default async function JoinCommitteePage() {
  const user = await requireApprovedUser();
  const memberships = await prisma.committeeMembership.findMany({ where: { userId: user.id } });

  return (
    <div>
      <PageHeader title="Join a Committee" subtitle="Get more involved in the John Mitchell Preserve community." />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {COMMITTEES.map((c) => {
          const membership = memberships.find((m) => m.committee === c.key);
          return (
            <div key={c.key} className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-semibold text-navy">{c.label}</h3>
              <p className="text-sm text-muted mt-1 mb-4">{c.desc}</p>
              {membership ? (
                <span
                  className={`text-sm font-medium ${membership.approved ? "text-primary" : "text-gold"}`}
                >
                  {membership.approved ? "You're a member of this committee" : "Request pending approval"}
                </span>
              ) : (
                <form
                  action={async () => {
                    "use server";
                    await requestJoinCommittee(c.key);
                  }}
                >
                  <button className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors">
                    Request to join
                  </button>
                </form>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
