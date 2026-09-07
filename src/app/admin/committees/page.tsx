import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { lastNameSortKey } from "@/lib/format";
import { approveCommitteeRequestAction, removeCommitteeMemberAction, setCommitteeChairAction } from "./actions";

export const dynamic = "force-dynamic";

const COMMITTEES = [
  { key: "ARCHITECTURE" as const, label: "Architecture Committee" },
  { key: "SOCIAL" as const, label: "Social Committee" },
];

export default async function AdminCommitteesPage() {
  await requireRole("ADMIN");
  const memberships = await prisma.committeeMembership.findMany({ include: { user: true } });

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold text-navy">Committees</h1>

      {COMMITTEES.map((c) => {
        const all = memberships.filter((m) => m.committee === c.key);
        const byName = (a: (typeof all)[number], b: (typeof all)[number]) =>
          lastNameSortKey(a.user.name).localeCompare(lastNameSortKey(b.user.name));
        const pending = all.filter((m) => !m.approved).sort(byName);
        const approved = all.filter((m) => m.approved).sort(byName);
        return (
          <section key={c.key}>
            <h2 className="font-semibold text-navy mb-3">{c.label}</h2>

            {pending.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs uppercase text-muted tracking-wide mb-2">Pending requests</h3>
                <ul className="space-y-2">
                  {pending.map((m) => (
                    <li key={m.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                      <span>{m.user.name}</span>
                      <div className="flex gap-3">
                        <form action={async () => { "use server"; await approveCommitteeRequestAction(m.id); }}>
                          <button className="text-xs text-primary font-medium hover:underline">Approve</button>
                        </form>
                        <form action={async () => { "use server"; await removeCommitteeMemberAction(m.id); }}>
                          <button className="text-xs text-muted hover:text-red-600">Deny</button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <h3 className="text-xs uppercase text-muted tracking-wide mb-2">Members</h3>
            {approved.length === 0 ? (
              <p className="text-sm text-muted">No approved members yet.</p>
            ) : (
              <ul className="space-y-2">
                {approved.map((m) => (
                  <li key={m.id} className="bg-card border border-border rounded-lg p-3 flex items-center justify-between">
                    <span>
                      {m.user.name} {m.role === "CHAIR" && <span className="text-xs text-gold ml-1">Chair</span>}
                    </span>
                    <div className="flex gap-3">
                      <form action={async () => { "use server"; await setCommitteeChairAction(m.id, m.role !== "CHAIR"); }}>
                        <button className="text-xs text-primary hover:underline">
                          {m.role === "CHAIR" ? "Unset chair" : "Make chair"}
                        </button>
                      </form>
                      <form action={async () => { "use server"; await removeCommitteeMemberAction(m.id); }}>
                        <button className="text-xs text-muted hover:text-red-600">Remove</button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
