"use client";

import { useActionState } from "react";
import { sendContactMessage } from "./actions";
import type { ContactRecipient } from "@prisma/client";

export default function ContactForm({ defaultRecipient = "BOARD" }: { defaultRecipient?: ContactRecipient }) {
  const [state, formAction, pending] = useActionState(sendContactMessage, undefined);

  if (state?.success) {
    return (
      <div className="bg-primary-light border border-primary/30 rounded-lg p-6 text-center">
        <p className="text-primary font-medium">Message sent - thank you!</p>
        <p className="text-sm text-muted mt-1">Someone will get back to you soon.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="recipient">
          Who would you like to contact?
        </label>
        <select
          id="recipient"
          name="recipient"
          className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          defaultValue={defaultRecipient}
        >
          <option value="BOARD">The Board</option>
          <option value="ARCHITECTURE">Architecture Committee</option>
          <option value="SOCIAL">Social Committee</option>
          <option value="LANDSCAPE">Landscape Committee</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="fromName">
            Your name
          </label>
          <input id="fromName" name="fromName" required className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="fromEmail">
            Your email
          </label>
          <input id="fromEmail" name="fromEmail" type="email" required className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-primary hover:bg-primary-dark text-white font-medium px-6 py-2 rounded transition-colors disabled:opacity-60"
      >
        {pending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
