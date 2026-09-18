import Link from "next/link";
import { format } from "date-fns";
import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { arcFolderLabel } from "@/lib/arc";
import ArcStatusBadge from "./ArcStatusBadge";

export const dynamic = "force-dynamic";

export default async function ArcRequestsPage() {
  await requireApprovedUser();

  const requests = await prisma.arcRequest.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <PageHeader
        title="ARC Requests"
        subtitle="Submit a new Architecture Review Committee request, or browse prior requests and their decisions."
      />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex justify-end mb-6">
          <Link
            href="/members/arc-requests/new"
            className="bg-primary hover:bg-primary-dark text-white font-medium px-5 py-2.5 rounded transition-colors"
          >
            Start a New ARC Request
          </Link>
        </div>

        {requests.length === 0 ? (
          <p className="text-muted">No ARC requests have been submitted yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {requests.map((r) => (
              <Link
                key={r.id}
                href={`/members/arc-requests/${r.id}`}
                className="flex flex-col gap-2 bg-card border border-border rounded-lg p-4 hover:border-primary hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-navy">{arcFolderLabel(r)}</span>
                  <ArcStatusBadge status={r.status} decision={r.decision} />
                </div>
                <span className="text-xs text-muted">Submitted {format(r.createdAt, "MMM d, yyyy")}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
