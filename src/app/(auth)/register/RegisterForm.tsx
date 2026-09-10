"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "../actions";

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  if (state?.success) {
    return (
      <div className="text-center space-y-3">
        <p className="text-primary font-medium">Thanks for registering!</p>
        <p className="text-sm text-muted">
          Your request has been sent to the Membership Coordinator for approval. You&apos;ll be able to log
          in once your account is approved.
        </p>
        <Link href="/" className="inline-block mt-2 text-primary hover:underline text-sm">
          Return to home
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="name">
          Full name
        </label>
        <input id="name" name="name" required className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="address">
          Property address
        </label>
        <input id="address" name="address" required className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-xs text-muted mt-1">At least 8 characters.</p>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 rounded transition-colors disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Request an account"}
      </button>
      <p className="text-sm text-muted text-center">
        Already registered?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
