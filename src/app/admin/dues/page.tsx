import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { listDuesPayments, formatCents, isStripeConfigured } from "@/lib/stripe";
import { HOA_TIME_ZONE } from "@/lib/format";
import { formatInTimeZone } from "date-fns-tz";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  succeeded: "Paid",
  processing: "Processing (bank)",
  requires_payment_method: "Failed",
  requires_action: "Incomplete",
  canceled: "Canceled",
};

export default async function DuesAdminPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  await requireRole("ADMIN", "BOARD_MEMBER");
  const thisYear = new Date().getFullYear();
  const { year: yearParam } = await searchParams;
  const year = /^\d{4}$/.test(yearParam ?? "") ? Number(yearParam) : thisYear;

  if (!isStripeConfigured()) {
    return <p className="text-muted">Online payments aren&apos;t configured (missing Stripe keys).</p>;
  }

  const payments = await listDuesPayments(year);
  const paid = payments.filter((p) => p.status === "succeeded");
  const totals = paid.reduce(
    (t, p) => ({ dues: t.dues + p.duesCents, fees: t.fees + p.feeCents, total: t.total + p.totalCents }),
    { dues: 0, fees: 0, total: 0 },
  );

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-1">
        <h1 className="text-2xl font-semibold text-navy">Online Dues Payments</h1>
        <a href={`/admin/dues/export?year=${year}`} className="text-sm text-primary font-medium hover:underline">
          Download CSV for QuickBooks
        </a>
      </div>
      <p className="text-muted mb-4 text-sm">
        Card and bank payments made through the website. Venmo and check payments aren&apos;t listed here. Stripe
        deposits these funds, minus its processing fees, to the HOA bank account.
      </p>
      <div className="flex gap-2 mb-6">
        {[thisYear, thisYear - 1, thisYear - 2].map((y) => (
          <Link key={y} href={`/admin/dues?year=${y}`}
            className={`px-3 py-1 rounded text-sm border ${y === year ? "bg-primary text-white border-primary" : "border-border text-navy hover:border-primary"}`}>
            {y}
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Stat label="Homes paid online" value={String(paid.length)} />
        <Stat label="Dues collected" value={formatCents(totals.dues)} />
        <Stat label="Convenience fees collected" value={formatCents(totals.fees)} />
      </div>

      {payments.length === 0 ? (
        <p className="text-muted">No online payments in {year}.</p>
      ) : (
        <div className="overflow-x-auto bg-card border border-border rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-left text-muted border-b border-border">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                <th className="px-3 py-2 font-medium">Property</th>
                <th className="px-3 py-2 font-medium">Paid by</th>
                <th className="px-3 py-2 font-medium">Method</th>
                <th className="px-3 py-2 font-medium text-right">Dues</th>
                <th className="px-3 py-2 font-medium text-right">Fee</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap">{formatInTimeZone(p.created, HOA_TIME_ZONE, "MMM d, yyyy")}</td>
                  <td className="px-3 py-2">{p.propertyAddress}</td>
                  <td className="px-3 py-2">{p.payerName}<div className="text-xs text-muted">{p.payerEmail}</div></td>
                  <td className="px-3 py-2 capitalize whitespace-nowrap">{p.method}</td>
                  <td className="px-3 py-2 text-right">{formatCents(p.duesCents)}</td>
                  <td className="px-3 py-2 text-right">{p.feeCents ? formatCents(p.feeCents) : "-"}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatCents(p.totalCents)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{STATUS_LABELS[p.status] ?? p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-2xl font-semibold text-navy">{value}</div>
      <div className="text-sm text-muted mt-1">{label}</div>
    </div>
  );
}
