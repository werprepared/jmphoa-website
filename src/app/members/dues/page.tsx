import PageHeader from "@/components/PageHeader";
import { requireApprovedUser } from "@/lib/authz";

export default async function DuesPage() {
  await requireApprovedUser();
  const venmo = process.env.VENMO_HANDLE || "@JMPHOA";
  const poBox = process.env.DUES_PO_BOX || "John Mitchell Preserve HOA, PO Box 000, Your City, ST 00000";

  return (
    <div>
      <PageHeader title="Pay Association Fees" subtitle="We currently accept dues via Venmo or by mail." />
      <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold text-navy mb-2">Pay with Venmo</h2>
          <p className="text-muted text-sm mb-3">
            Send your association fee payment to our Venmo account. Please include your property address in
            the payment note so we can credit your account correctly.
          </p>
          <div className="text-2xl font-semibold text-primary">{venmo}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-semibold text-navy mb-2">Pay by Mail</h2>
          <p className="text-muted text-sm mb-3">
            Prefer to mail a check? Send it, along with your property address, to:
          </p>
          <div className="whitespace-pre-line text-navy font-medium">{poBox}</div>
        </div>
        <p className="text-xs text-muted">
          Questions about your balance or a payment? <a className="text-primary hover:underline" href="/contact">Contact the Board</a>.
        </p>
      </div>
    </div>
  );
}
