"use client";

import { useActionState, useState } from "react";
import { saveDuesSettingsAction, type DuesSettingsState } from "./actions";
import type { DuesSettings } from "@/lib/dues";

const inputClass =
  "w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary";

function money(text: string) {
  const n = Number(text.replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n)) return "$?";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });
}

function longDate(iso: string, withYear = true) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "?";
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

export default function DuesSettingsForm({ settings }: { settings: DuesSettings }) {
  const [state, formAction, pending] = useActionState<DuesSettingsState, FormData>(saveDuesSettingsAction, undefined);
  const [year, setYear] = useState(String(settings.year));
  const [amount, setAmount] = useState((settings.amountCents / 100).toFixed(2));
  const [dueDate, setDueDate] = useState(settings.dueDate);
  const [lateFee, setLateFee] = useState((settings.lateFeeCents / 100).toFixed(2));

  const hasLateFee = Number(lateFee.replace(/[$,\s]/g, "")) > 0;
  const preview =
    `Dues for ${year} are ${money(amount)} if paid by ${longDate(dueDate)}.` +
    (hasLateFee ? ` A late fee of ${money(lateFee)} is added for payments received after ${longDate(dueDate, false)}.` : "");

  return (
    <form action={formAction} className="space-y-4 bg-card border border-border rounded-lg p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="year">Dues year</label>
          <input id="year" name="year" inputMode="numeric" className={inputClass} value={year}
            onChange={(e) => setYear(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="amount">Dues amount ($)</label>
          <input id="amount" name="amount" inputMode="decimal" className={inputClass} value={amount}
            onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="dueDate">Pay by (due date)</label>
          <input id="dueDate" name="dueDate" type="date" className={inputClass} value={dueDate}
            onChange={(e) => setDueDate(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="lateFee">Late fee after due date ($)</label>
          <input id="lateFee" name="lateFee" inputMode="decimal" className={inputClass} value={lateFee}
            onChange={(e) => setLateFee(e.target.value)} required />
        </div>
      </div>

      <div className="bg-background border border-border rounded p-3">
        <div className="text-xs font-semibold uppercase text-muted tracking-wide mb-1">Shown on the dues page</div>
        <p className="text-sm text-navy">{preview}</p>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Saved. The dues page now shows these settings.</p>}
      <button type="submit" disabled={pending}
        className="bg-primary hover:bg-primary-dark text-white font-medium px-5 py-2 rounded transition-colors disabled:opacity-60">
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
