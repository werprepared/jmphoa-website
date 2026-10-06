"use server";

import { z } from "zod";
import Stripe from "stripe";
import {
  getStripe,
  quoteFromConfirmationToken,
  DUES_PURPOSE,
  DUES_PAYMENT_METHOD_TYPES,
  type DuesQuote,
} from "@/lib/stripe";

export type QuoteResult = { quote: DuesQuote; error?: undefined } | { error: string; quote?: undefined };

/** Looks up the entered payment method and returns the exact amount (including any credit card fee) before charging. */
export async function getDuesQuote(confirmationTokenId: string): Promise<QuoteResult> {
  if (!/^ctoken_\w+$/.test(confirmationTokenId)) return { error: "Invalid payment details." };
  try {
    const token = await getStripe().confirmationTokens.retrieve(confirmationTokenId);
    return { quote: quoteFromConfirmationToken(token) };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

const paySchema = z.object({
  confirmationTokenId: z.string().regex(/^ctoken_\w+$/, "Invalid payment details."),
  quotedTotalCents: z.number().int().positive(),
  payerName: z.string().trim().min(1, "Please enter your name.").max(120),
  payerEmail: z.string().trim().email("Please enter a valid email."),
  propertyAddress: z.string().trim().min(3, "Please enter your property address.").max(200),
});

export type PayResult =
  | { status: Stripe.PaymentIntent.Status; clientSecret: string; error?: undefined }
  | { error: string; status?: undefined; clientSecret?: undefined };

/** Creates and confirms the dues PaymentIntent. The amount is always recomputed here, never trusted from the browser. */
export async function payDues(input: z.input<typeof paySchema>): Promise<PayResult> {
  const parsed = paySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Please check your entries." };
  const { confirmationTokenId, quotedTotalCents, payerName, payerEmail, propertyAddress } = parsed.data;

  try {
    const stripe = getStripe();
    const token = await stripe.confirmationTokens.retrieve(confirmationTokenId);
    const quote = quoteFromConfirmationToken(token);
    if (quote.totalCents !== quotedTotalCents) {
      return { error: "The payment amount changed. Please review your payment again." };
    }

    const intent = await stripe.paymentIntents.create(
      {
        amount: quote.totalCents,
        currency: "usd",
        confirm: true,
        confirmation_token: confirmationTokenId,
        allowed_payment_method_types: [...DUES_PAYMENT_METHOD_TYPES],
        description: `JMPHOA annual dues - ${propertyAddress}`,
        receipt_email: payerEmail,
        statement_descriptor_suffix: "HOA DUES",
        metadata: {
          purpose: DUES_PURPOSE,
          payer_name: payerName,
          payer_email: payerEmail,
          property_address: propertyAddress,
          payment_method: quote.method,
          dues_amount_cents: String(quote.baseCents),
          convenience_fee_cents: String(quote.feeCents),
        },
      },
      // A double-click or retry with the same token can never create a second charge.
      { idempotencyKey: `dues-${confirmationTokenId}` },
    );

    return { status: intent.status, clientSecret: intent.client_secret! };
  } catch (err) {
    return { error: errorMessage(err) };
  }
}

function errorMessage(err: unknown) {
  if (err instanceof Stripe.errors.StripeCardError) return err.message;
  if (err instanceof Stripe.errors.StripeError) {
    console.error("[dues] Stripe error:", err.type, err.code, err.message);
    return err.code === "payment_intent_unexpected_state"
      ? "This payment was already submitted."
      : "We couldn't process that payment. Please try again or use another payment method.";
  }
  console.error("[dues] Unexpected error:", err);
  return err instanceof Error ? err.message : "Something went wrong. Please try again.";
}
