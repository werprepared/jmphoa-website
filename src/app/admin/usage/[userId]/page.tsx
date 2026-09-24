import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { startOfTodayLocal } from "@/lib/format";

export const dynamic = "force-dynamic";

type Range = "week" | "month" | "year";
const RANGES: Range[] = ["week", "month", "year"];
const RANGE_LABELS: Record<Range, string> = { week: "Week", month: "Month", year: "Year" };

function rangeStartFor(range: Range): Date {
  const start = startOfTodayLocal();
  if (range === "week") start.setDate(start.getDate() - 7);
  else if (range === "month") start.setMonth(start.getMonth() - 1);
  else start.setFullYear(start.getFullYear() - 1);
  return start;
}

export default async function UsageMemberDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ range?: string }>;
}) {
  await requireRole("ADMIN");
  const { userId } = await params;
  const { range: rangeParam } = await searchParams;
  const range: Range = RANGES.includes(rangeParam as Range) ? (rangeParam as Range) : "week";
  const rangeStart = rangeStartFor(range);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  if (!user) notFound();

  const byPath = await prisma.pageView.groupBy({
    by: ["path"],
    where: { userId, createdAt: { gte: rangeStart } },
    _count: { path: true },
    orderBy: { _count: { path: "desc" } },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/usage?range=${range}`} className="text-sm text-primary hover:underline">
          ← All members
        </Link>
        <h1 className="text-2xl font-semibold text-navy mt-2">{user.name}</h1>
        <p className="text-sm text-muted">{user.email}</p>
      </div>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`/admin/usage/${userId}?range=${r}`}
            className={`text-sm px-3 py-1.5 rounded-full border ${
              r === range ? "bg-primary text-white border-primary" : "border-border text-navy hover:border-primary"
            }`}
          >
            {RANGE_LABELS[r]}
          </Link>
        ))}
      </div>

      <div>
        <h2 className="font-semibold text-navy text-sm mb-3">Pages viewed (past {RANGE_LABELS[range].toLowerCase()})</h2>
        {byPath.length === 0 ? (
          <p className="text-muted text-sm">No activity in this timeframe.</p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {byPath.map((row) => (
              <li key={row.path} className="flex items-center justify-between px-4 py-3 bg-card">
                <span className="text-navy font-mono text-sm">{row.path}</span>
                <span className="text-sm text-muted">
                  {row._count.path} view{row._count.path === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
