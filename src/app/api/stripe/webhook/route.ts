import type Stripe from "stripe";
import { getStripe, DUES_PURPOSE, formatCents } from "@/lib/stripe";
import { sendMail } from "@/lib/mailer";

/**
 * Stripe webhook. Notifies the treasurer when a dues payment succeeds or a bank payment fails,
 * so it can be recorded in QuickBooks. Stripe itself remains the payment record.
 */
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Webhook not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await getStripe().webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "payment_intent.succeeded" || event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    const succeeded = event.type === "payment_intent.succeeded";
    // Card declines are shown to the payer on the spot; only bank payments fail after the fact.
    const notify = succeeded || intent.metadata.payment_method === "bank";
    if (intent.metadata.purpose === DUES_PURPOSE && notify) {
      await notifyTreasurer(intent, succeeded);
    }
  }

  return new Response("ok");
}

async function notifyTreasurer(intent: Stripe.PaymentIntent, succeeded: boolean) {
  const to = process.env.DUES_NOTIFY_EMAIL || process.env.BOARD_EMAIL || "board@jmphoa.org";
  const m = intent.metadata;
  const fee = Number(m.convenience_fee_cents ?? 0);
  const lines = [
    `Property: ${m.property_address}`,
    `Paid by: ${m.payer_name} <${m.payer_email}>`,
    `Method: ${m.payment_method?.replace("_", " ")}`,
    `Dues: ${formatCents(Number(m.dues_amount_cents ?? intent.amount))}`,
    fee > 0 ? `Credit card convenience fee: ${formatCents(fee)}` : null,
    `Total: ${formatCents(intent.amount)}`,
    `Stripe payment ID: ${intent.id}`,
    !succeeded && intent.last_payment_error?.message ? `Reason: ${intent.last_payment_error.message}` : null,
  ].filter(Boolean);

  await sendMail({
    to,
    subject: succeeded
      ? `Dues payment received - ${m.property_address}`
      : `Dues payment FAILED - ${m.property_address}`,
    text: `${succeeded ? "A dues payment was received online." : "An online dues payment failed and was not collected."}\n\n${lines.join("\n")}`,
  });
}
