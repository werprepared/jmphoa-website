import Link from "next/link";
import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  await requireApprovedUser();
  const positions = await prisma.boardPosition.findMany({
    orderBy: { sortOrder: "asc" },
    include: { user: { include: { profile: true } } },
  });

  return (
    <div>
      <PageHeader title="Board Members" subtitle="The volunteers who govern and serve the John Mitchell Preserve HOA." />
      <div className="max-w-4xl mx-auto px-4 py-10">
        {positions.length === 0 ? (
          <p className="text-muted">Board member information will be posted here soon.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {positions.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-lg p-5">
                <div className="font-semibold text-navy">{p.title}</div>
                <div className="text-muted">
                  {p.user ? (
                    p.user.profile?.showInDirectory === false ? (
                      p.user.name
                    ) : (
                      <Link href={`/members/directory/${p.user.id}`} className="text-primary hover:underline">
                        {p.user.name}
                      </Link>
                    )
                  ) : (
                    "Vacant"
                  )}
                </div>
                {p.user?.profile?.publicEmail && (
                  <div className="text-sm text-primary mt-1">{p.user.profile.publicEmail}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
