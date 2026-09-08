"use client";

import { useActionState, useRef } from "react";
import { changePasswordAction, type PasswordState } from "./actions";

export default function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<PasswordState, FormData>(async (prev, fd) => {
    const result = await changePasswordAction(prev, fd);
    if (result?.success) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <div className="bg-card border border-border rounded-lg p-5 mt-8">
      <h2 className="font-semibold text-navy mb-3">Change Password</h2>
      <form ref={formRef} action={formAction} className="space-y-3 max-w-sm">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="currentPassword">
            Current password
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="newPassword">
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.success && <p className="text-sm text-primary">Password updated.</p>}

        <button
          type="submit"
          disabled={pending}
          className="bg-primary hover:bg-primary-dark text-white font-medium px-6 py-2 rounded transition-colors disabled:opacity-60"
        >
          {pending ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
