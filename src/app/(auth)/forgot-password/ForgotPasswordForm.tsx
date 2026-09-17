"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "../actions";

export default function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined);

  if (state?.success) {
    return (
      <div className="text-center space-y-3">
        <p className="text-primary font-medium">Check your email</p>
        <p className="text-sm text-muted">
          If that email is registered, we&apos;ve sent a link to reset your password. It expires in 1 hour.
        </p>
        <Link href="/login" className="inline-block mt-2 text-primary hover:underline text-sm">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded transition-colors disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send reset link"}
      </button>
      <p className="text-sm text-muted text-center">
        <Link href="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
