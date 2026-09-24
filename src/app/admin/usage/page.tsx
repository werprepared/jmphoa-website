import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { startOfTodayLocal, lastFirst } from "@/lib/format";

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

export default async function UsageAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await requireRole("ADMIN");
  const { range: rangeParam } = await searchParams;
  const range: Range = RANGES.includes(rangeParam as Range) ? (rangeParam as Range) : "week";
  const rangeStart = rangeStartFor(range);

  const [totalViews, byUser] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: rangeStart } } }),
    prisma.pageView.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: rangeStart } },
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
    }),
  ]);

  const users = await prisma.user.findMany({
    where: { id: { in: byUser.map((u) => u.userId) } },
    select: { id: true, name: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.name]));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">System Usage</h1>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <Link
            key={r}
            href={`/admin/usage?range=${r}`}
            className={`text-sm px-3 py-1.5 rounded-full border ${
              r === range ? "bg-primary text-white border-primary" : "border-border text-navy hover:border-primary"
            }`}
          >
            {RANGE_LABELS[r]}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-3xl font-bold text-navy">{byUser.length}</div>
          <div className="text-sm text-muted mt-1">Members logged in (past {RANGE_LABELS[range].toLowerCase()})</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-3xl font-bold text-navy">{totalViews}</div>
          <div className="text-sm text-muted mt-1">Pages viewed (past {RANGE_LABELS[range].toLowerCase()})</div>
        </div>
      </div>

      <div>
        <h2 className="font-semibold text-navy text-sm mb-3">By member</h2>
        {byUser.length === 0 ? (
          <p className="text-muted text-sm">No activity in this timeframe.</p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {byUser.map((row) => {
              const name = nameById.get(row.userId);
              return (
                <li key={row.userId} className="flex items-center justify-between px-4 py-3 bg-card">
                  <Link href={`/admin/usage/${row.userId}?range=${range}`} className="text-primary hover:underline font-medium">
                    {name ? lastFirst(name) : "Unknown member"}
                  </Link>
                  <span className="text-sm text-muted">
                    {row._count.userId} page{row._count.userId === 1 ? "" : "s"} viewed
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
