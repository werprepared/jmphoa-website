import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Shared Stripe client. Throws if STRIPE_SECRET_KEY isn't configured. */
export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not configured.");
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

export function isStripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}

/** Tags every dues PaymentIntent so the admin list and webhook can find them. */
export const DUES_PURPOSE = "hoa_dues";

/** Payment methods offered online. Kept explicit so we always know whether a card is credit or debit. */
export const DUES_PAYMENT_METHOD_TYPES = ["card", "us_bank_account"] as const;

/** Convenience fee for credit cards only: 2.9% + $0.30 of the amount being paid. */
export const CARD_FEE_PERCENT = 2.9;
export const CARD_FEE_FIXED_CENTS = 30;

export function creditCardFeeCents(baseCents: number) {
  return Math.round((baseCents * CARD_FEE_PERCENT) / 100) + CARD_FEE_FIXED_CENTS;
}

export type DuesQuote = {
  method: "credit_card" | "debit_card" | "prepaid_card" | "card" | "bank";
  methodLabel: string;
  baseCents: number;
  feeCents: number;
  totalCents: number;
};

/**
 * Works out what to charge for a ConfirmationToken. Only cards that Stripe reports as
 * `credit` get the convenience fee; debit, prepaid, unknown-funding cards and bank (ACH)
 * payments are charged exactly the amount the payer entered.
 */
export function quoteFromConfirmationToken(token: Stripe.ConfirmationToken, baseCents: number): DuesQuote {
  const preview = token.payment_method_preview;
  if (!preview) throw new Error("Missing payment details.");

  if (preview.type === "us_bank_account") {
    const bank = preview.us_bank_account;
    const label = bank ? `Bank account (${bank.bank_name ?? "bank"} ••••${bank.last4})` : "Bank account";
    return { method: "bank", methodLabel: label, baseCents, feeCents: 0, totalCents: baseCents };
  }

  if (preview.type === "card" && preview.card) {
    const { brand, last4, funding } = preview.card;
    const brandName = brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : "Card";
    if (funding === "credit") {
      const feeCents = creditCardFeeCents(baseCents);
      return {
        method: "credit_card",
        methodLabel: `${brandName} credit card ••••${last4}`,
        baseCents,
        feeCents,
        totalCents: baseCents + feeCents,
      };
    }
    const kind = funding === "debit" ? "debit card" : funding === "prepaid" ? "prepaid card" : "card";
    return {
      method: funding === "debit" ? "debit_card" : funding === "prepaid" ? "prepaid_card" : "card",
      methodLabel: `${brandName} ${kind} ••••${last4}`,
      baseCents,
      feeCents: 0,
      totalCents: baseCents,
    };
  }

  throw new Error("That payment method isn't supported. Please use a card or bank account.");
}

export function formatCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export type DuesPaymentRow = {
  id: string;
  created: Date;
  status: Stripe.PaymentIntent.Status;
  payerName: string;
  payerEmail: string;
  propertyAddress: string;
  method: string;
  duesYear: string;
  duesCents: number;
  feeCents: number;
  totalCents: number;
};

/** All dues payments created in a calendar year, newest first, read straight from Stripe. */
export async function listDuesPayments(year: number): Promise<DuesPaymentRow[]> {
  const start = Math.floor(Date.UTC(year, 0, 1) / 1000);
  const end = Math.floor(Date.UTC(year + 1, 0, 1) / 1000);
  const rows: DuesPaymentRow[] = [];
  for await (const pi of getStripe().paymentIntents.search({
    query: `metadata['purpose']:'${DUES_PURPOSE}' AND created>=${start} AND created<${end}`,
    limit: 100,
  })) {
    const m = pi.metadata;
    rows.push({
      id: pi.id,
      created: new Date(pi.created * 1000),
      status: pi.status,
      payerName: m.payer_name ?? "",
      payerEmail: m.payer_email ?? "",
      propertyAddress: m.property_address ?? "",
      method: (m.payment_method ?? "").replace("_", " "),
      duesYear: m.dues_year ?? "",
      duesCents: Number(m.dues_amount_cents ?? pi.amount),
      feeCents: Number(m.convenience_fee_cents ?? 0),
      totalCents: pi.amount,
    });
    if (rows.length >= 1000) break;
  }
  return rows.sort((a, b) => b.created.getTime() - a.created.getTime());
}
