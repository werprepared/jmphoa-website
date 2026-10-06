"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { getDuesQuote, payDues } from "./actions";
import type { DuesQuote } from "@/lib/stripe";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Defaults = { name: string; email: string; address: string };

const money = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

type Limits = { minCents: number; maxCents: number };

/** "212.5" or "$212.50" -> 21250 cents; null if it isn't a valid dollar amount. */
function parseDollars(text: string) {
  const cleaned = text.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

export default function DuesPaymentForm({
  amountCents,
  limits,
  defaults,
}: {
  amountCents: number;
  limits: Limits;
  defaults: Defaults;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: "payment",
        amount: amountCents,
        currency: "usd",
        paymentMethodCreation: "manual",
        allowedPaymentMethodTypes: ["card", "us_bank_account"],
        appearance: {
          theme: "stripe",
          variables: { colorPrimary: "#2f6b63", colorText: "#1f2a2a", borderRadius: "6px" },
        },
      }}
    >
      <PaymentForm defaults={defaults} initialAmountCents={amountCents} limits={limits} />
    </Elements>
  );
}

function PaymentForm({
  defaults,
  initialAmountCents,
  limits,
}: {
  defaults: Defaults;
  initialAmountCents: number;
  limits: Limits;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [payer, setPayer] = useState(defaults);
  const [amountText, setAmountText] = useState((initialAmountCents / 100).toFixed(2));
  const [review, setReview] = useState<{ tokenId: string; quote: DuesQuote } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<"succeeded" | "processing" | null>(null);
  const [selectedType, setSelectedType] = useState("card");
  const unsupported = selectedType !== "card" && selectedType !== "us_bank_account";

  async function handleReview(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements || unsupported) return;
    setError(null);
    if (!payer.name.trim() || !payer.email.trim() || !payer.address.trim()) {
      setError("Please fill in your name, email, and property address.");
      return;
    }
    const amountCents = parseDollars(amountText);
    if (amountCents === null) return setError("Please enter the amount you're paying, like 200.00.");
    if (amountCents < limits.minCents || amountCents > limits.maxCents) {
      return setError(`Please enter an amount between ${money(limits.minCents)} and ${money(limits.maxCents)}.`);
    }
    setBusy(true);
    try {
      // Keeps the bank-account and card screens showing the right amount.
      elements.update({ amount: amountCents });
      const { error: submitError } = await elements.submit();
      if (submitError) return setError(submitError.message ?? "Please check your payment details.");

      const { error: tokenError, confirmationToken } = await stripe.createConfirmationToken({
        elements,
        params: {
          return_url: `${window.location.origin}/dues/complete`,
          payment_method_data: { billing_details: { name: payer.name, email: payer.email } },
        },
      });
      if (tokenError) return setError(tokenError.message ?? "Please check your payment details.");

      const result = await getDuesQuote(confirmationToken.id, amountCents);
      if (result.error) return setError(result.error);
      setReview({ tokenId: confirmationToken.id, quote: result.quote! });
    } finally {
      setBusy(false);
    }
  }

  async function handlePay() {
    if (!stripe || !review) return;
    setError(null);
    setBusy(true);
    try {
      const result = await payDues({
        confirmationTokenId: review.tokenId,
        amountCents: review.quote.baseCents,
        quotedTotalCents: review.quote.totalCents,
        payerName: payer.name,
        payerEmail: payer.email,
        propertyAddress: payer.address,
      });
      if (result.error) {
        setReview(null);
        return setError(result.error);
      }

      let status: string = result.status!;
      if (status === "requires_action") {
        const { error: actionError, paymentIntent } = await stripe.handleNextAction({ clientSecret: result.clientSecret! });
        if (actionError) {
          setReview(null);
          return setError(actionError.message ?? "Payment was not completed.");
        }
        status = paymentIntent?.status ?? status;
      }

      if (status === "succeeded") setDone("succeeded");
      else if (status === "processing") setDone("processing");
      else {
        setReview(null);
        setError("Payment was not completed. Please try again or use another payment method.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="bg-primary-light border border-primary/30 rounded-lg p-6 text-center">
        <p className="text-primary font-medium">
          {done === "succeeded" ? "Payment received - thank you!" : "Thank you! Your bank payment is processing."}
        </p>
        <p className="text-sm text-muted mt-1">
          {done === "succeeded"
            ? `A receipt has been emailed to ${payer.email}.`
            : "Bank payments usually take about 4 business days to clear. We'll email a receipt once it does."}
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-background";

  return (
    <form onSubmit={handleReview} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="payerName">Your name</label>
          <input id="payerName" className={inputClass} value={payer.name} disabled={!!review}
            onChange={(e) => setPayer({ ...payer, name: e.target.value })} autoComplete="name" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="payerEmail">Email for receipt</label>
          <input id="payerEmail" type="email" className={inputClass} value={payer.email} disabled={!!review}
            onChange={(e) => setPayer({ ...payer, email: e.target.value })} autoComplete="email" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="propertyAddress">Property address in the Preserve</label>
        <input id="propertyAddress" className={inputClass} value={payer.address} disabled={!!review}
          onChange={(e) => setPayer({ ...payer, address: e.target.value })} autoComplete="street-address" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="amount">Amount you&apos;re paying</label>
        <div className="relative max-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">$</span>
          <input id="amount" inputMode="decimal" className={`${inputClass} pl-7`} value={amountText} disabled={!!review}
            onChange={(e) => setAmountText(e.target.value)}
            onBlur={() => {
              const cents = parseDollars(amountText);
              if (cents !== null) setAmountText((cents / 100).toFixed(2));
            }}
            required />
        </div>
        <p className="text-xs text-muted mt-1">
          Filled in with the amount currently due. Change it if you&apos;re paying a different amount.
        </p>
      </div>

      <div className={review ? "pointer-events-none opacity-60" : ""} aria-disabled={!!review}>
        <PaymentElement
          options={{
            layout: "tabs",
            wallets: { applePay: "never", googlePay: "never", link: "never" },
            defaultValues: { billingDetails: { name: payer.name, email: payer.email } },
          }}
          onChange={(e) => setSelectedType(e.value.type)}
          onLoadError={(e) => setError(e.error.message ?? "Online payments are unavailable right now.")}
        />
      </div>

      {unsupported && !review && (
        <p className="text-sm text-red-700">Please pay with a card or US bank account. Other options aren&apos;t accepted.</p>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}

      {review ? (
        <div className="border border-primary/40 bg-primary-light rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-navy">Review your payment</h3>
          <dl className="text-sm space-y-1">
            <Row label="Paying with" value={review.quote.methodLabel} />
            <Row label="Payment amount" value={money(review.quote.baseCents)} />
            {review.quote.feeCents > 0 && (
              <Row label="Credit card convenience fee (2.9% + $0.30)" value={money(review.quote.feeCents)} />
            )}
            <div className="border-t border-primary/30 pt-1 font-semibold">
              <Row label="Total" value={money(review.quote.totalCents)} />
            </div>
          </dl>
          {review.quote.feeCents > 0 && (
            <p className="text-xs text-muted">
              To avoid the fee, choose &ldquo;Change payment method&rdquo; and pay with a bank account or debit card.
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handlePay} disabled={busy}
              className="bg-primary text-white font-medium px-5 py-2 rounded hover:bg-primary-dark disabled:opacity-60">
              {busy ? "Processing..." : `Pay ${money(review.quote.totalCents)}`}
            </button>
            <button type="button" onClick={() => { setReview(null); setError(null); }} disabled={busy}
              className="px-5 py-2 rounded border border-border bg-card text-navy hover:border-primary disabled:opacity-60">
              Change payment method
            </button>
          </div>
        </div>
      ) : (
        <button type="submit" disabled={!stripe || busy || unsupported}
          className="bg-primary text-white font-medium px-5 py-2 rounded hover:bg-primary-dark disabled:opacity-60">
          {busy ? "Checking..." : "Review payment"}
        </button>
      )}
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-navy text-right">{value}</dd>
    </div>
  );
}
