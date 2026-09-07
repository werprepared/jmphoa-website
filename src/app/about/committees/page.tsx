import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { lastNameSortKey } from "@/lib/format";

export const dynamic = "force-dynamic";

const COMMITTEES = [
  { key: "ARCHITECTURE" as const, label: "Architecture Committee", email: "JMPHOArch@gmail.com" },
  { key: "SOCIAL" as const, label: "Social Committee", email: "JMPHOAsocial@gmail.com" },
];

export default async function CommitteesPage() {
  const memberships = await prisma.committeeMembership.findMany({
    where: { approved: true },
    include: { user: { include: { profile: true } } },
  });
  memberships.sort((a, b) => lastNameSortKey(a.user.name).localeCompare(lastNameSortKey(b.user.name)));

  return (
    <div>
      <PageHeader title="Committee Members" subtitle="Our committees help run architecture reviews and community events." />
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {COMMITTEES.map((c) => {
          const members = memberships.filter((m) => m.committee === c.key);
          return (
            <div key={c.key}>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-xl font-semibold text-navy">{c.label}</h2>
                <a href={`mailto:${c.email}`} className="text-sm text-primary hover:underline">
                  {c.email}
                </a>
              </div>
              {members.length === 0 ? (
                <p className="text-muted text-sm">No members listed yet.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
