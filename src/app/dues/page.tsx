import PageHeader from "@/components/PageHeader";
import { getCurrentUser } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  duesAmountCents,
  creditCardFeeCents,
  formatCents,
  isStripeConfigured,
  CARD_FEE_PERCENT,
  CARD_FEE_FIXED_CENTS,
} from "@/lib/stripe";
import DuesPaymentForm from "./DuesPaymentForm";

export const dynamic = "force-dynamic";

// Public on purpose: the QR code on each QuickBooks invoice links here, so homeowners
// without a website login can still pay.
export default async function DuesPage() {
  const venmo = process.env.VENMO_HANDLE || "@JMPHOA";
  const poBox = process.env.DUES_PO_BOX || "John Mitchell Preserve HOA, PO Box 000, Your City, ST 00000";
  const amountCents = duesAmountCents();
  const onlineEnabled = isStripeConfigured();

  const user = await getCurrentUser();
  const profile = user?.id
    ? await prisma.memberProfile.findUnique({ where: { userId: user.id }, select: { address: true } })
    : null;
  const defaults = { name: user?.name ?? "", email: user?.email ?? "", address: profile?.address ?? "" };

  return (
    <div>
      <PageHeader
        title="Pay Association Fees"
        subtitle={`Annual dues are ${formatCents(amountCents)} per home. Pay online by bank account or card, with Venmo, or by mail.`}
      />
      <div className="max-w-xl mx-auto px-4 py-10 space-y-6">
        {onlineEnabled && (
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-semibold text-navy mb-2">Pay Online</h2>
            <p className="text-muted text-sm mb-4">
              Pay securely with a bank account (ACH) or a debit card at no extra cost. Credit card payments
              include a {CARD_FEE_PERCENT}% + {formatCents(CARD_FEE_FIXED_CENTS)} convenience fee (
              {formatCents(creditCardFeeCents(amountCents))} on{" "}
              {formatCents(amountCents)}). You&apos;ll see the exact total before you pay.
            </p>
            <DuesPaymentForm amountCents={amountCents} defaults={defaults} />
          </div>
        )}
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
