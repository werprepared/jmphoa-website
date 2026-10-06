import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getStripe, DUES_PURPOSE } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Stripe sends the payer here if their bank or card issuer needed a redirect to finish the payment.
export default async function DuesCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string }>;
}) {
  const { payment_intent: id } = await searchParams;
  let status: string | null = null;
  if (id && /^pi_\w+$/.test(id)) {
    try {
      const intent = await getStripe().paymentIntents.retrieve(id);
      if (intent.metadata.purpose === DUES_PURPOSE) status = intent.status;
    } catch {
      status = null;
    }
  }

  const message =
    status === "succeeded"
      ? { title: "Payment received - thank you!", body: "A receipt has been emailed to you." }
      : status === "processing"
        ? {
            title: "Thank you! Your payment is processing.",
            body: "Bank payments usually take about 4 business days to clear. We'll email a receipt once it does.",
          }
        : { title: "Payment not completed", body: "Your payment didn't go through. Please try again or use another payment method." };

  return (
    <div>
      <PageHeader title="Pay Association Fees" />
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-primary font-medium">{message.title}</p>
          <p className="text-sm text-muted mt-1">{message.body}</p>
          <Link href="/dues" className="inline-block mt-4 text-primary hover:underline text-sm">
            Back to payment options
          </Link>
        </div>
      </div>
    </div>
  );
}
