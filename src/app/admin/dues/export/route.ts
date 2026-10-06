import { getCurrentUser } from "@/lib/authz";
import { canSeeDuesPayments } from "@/lib/dues";
import { listDuesPayments } from "@/lib/stripe";
import { HOA_TIME_ZONE } from "@/lib/format";
import { formatInTimeZone } from "date-fns-tz";

/** CSV of successful online dues payments for a year, for entry into QuickBooks. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.status !== "APPROVED" || !(await canSeeDuesPayments(user))) {
    return new Response("Forbidden", { status: 403 });
  }
  const yearParam = new URL(request.url).searchParams.get("year") ?? "";
  const year = /^\d{4}$/.test(yearParam) ? Number(yearParam) : new Date().getFullYear();

  const payments = (await listDuesPayments(year)).filter((p) => p.status === "succeeded");
  const header = ["Date", "Dues Year", "Property Address", "Payer Name", "Payer Email", "Method", "Amount", "Convenience Fee", "Total", "Stripe Payment ID"];
  const rows = payments.map((p) => [
    formatInTimeZone(p.created, HOA_TIME_ZONE, "MM/dd/yyyy"),
    p.duesYear,
    p.propertyAddress,
    p.payerName,
    p.payerEmail,
    p.method,
    (p.duesCents / 100).toFixed(2),
    (p.feeCents / 100).toFixed(2),
    (p.totalCents / 100).toFixed(2),
    p.id,
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jmphoa-dues-${year}.csv"`,
    },
  });
}

function csvCell(value: string) {
  // Quote everything and neutralize spreadsheet formulas in user-entered text.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
