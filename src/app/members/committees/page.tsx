import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { lastNameSortKey } from "@/lib/format";
import { requestJoinCommittee } from "./actions";

export const dynamic = "force-dynamic";

const COMMITTEES = [
  {
    key: "ARCHITECTURE" as const,
    label: "Architecture Committee",
    recipient: "ARCHITECTURE" as const,
    email: "JMPHOArch@gmail.com",
    desc: "Reviews home exterior modification requests and helps maintain neighborhood standards.",
  },
  {
    key: "SOCIAL" as const,
    label: "Social Committee",
    recipient: "SOCIAL" as const,
    email: "JMPHOAsocial@gmail.com",
    desc: "Plans community events, gatherings, and neighborhood get-togethers.",
  },
  {
    key: "LANDSCAPE" as const,
    label: "Landscape Committee",
    recipient: "LANDSCAPE" as const,
    email: "JMPlandscape@gmail.com",
    desc: "Oversees common-area landscaping and neighborhood beautification.",
  },
];

export default async function CommitteeMembersPage() {
  const user = await requireApprovedUser();

  const [roster, ownMemberships] = await Promise.all([
    prisma.committeeMembership.findMany({
      where: { approved: true },
      include: { user: { include: { profile: true } } },
    }),
    prisma.committeeMembership.findMany({ where: { userId: user.id } }),
  ]);
  roster.sort((a, b) => lastNameSortKey(a.user.name).localeCompare(lastNameSortKey(b.user.name)));

  return (
    <div>
      <PageHeader
        title="Committee Members"
        subtitle="Our committees help run architecture reviews, community events, and neighborhood landscaping."
      />
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {COMMITTEES.map((c) => {
          const members = roster.filter((m) => m.committee === c.key);
          const ownMembership = ownMemberships.find((m) => m.committee === c.key);

          return (
            <div key={c.key}>
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-xl font-semibold text-navy">{c.label}</h2>
                <Link href={`/contact?to=${c.recipient}`} className="text-sm text-primary hover:underline">
                  {c.email}
                </Link>
              </div>
              <p className="text-sm text-muted mb-3">{c.desc}</p>

              {members.length === 0 ? (
                <p className="text-muted text-sm mb-4">No members listed yet.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2 mb-4">
                  {members.map((m) => (
                    <li key={m.id} className="bg-card border border-border rounded-lg px-4 py-3 flex justify-between">
                      {m.user.profile?.showInDirectory === false ? (
                        <span>{m.user.name}</span>
                      ) : (
                        <Link href={`/members/directory/${m.user.id}`} className="text-primary hover:underline">
                          {m.user.name}
                        </Link>
                      )}
                      {m.role === "CHAIR" && <span className="text-xs text-gold font-medium">Chair</span>}
                    </li>
                  ))}
                </ul>
              )}

              {ownMembership ? (
                <span className={`text-sm font-medium ${ownMembership.approved ? "text-primary" : "text-gold"}`}>
                  {ownMembership.approved ? "You're a member of this committee" : "Request pending approval"}
                </span>
              ) : (
                <form action={async () => { "use server"; await requestJoinCommittee(c.key); }}>
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
