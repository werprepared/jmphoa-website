"use client";

import { useActionState, useState } from "react";
import { sendMemberMessageAction, type MessageState } from "./actions";

export default function MessageMemberForm({ recipientId, recipientName }: { recipientId: string; recipientName: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<MessageState, FormData>(
    sendMemberMessageAction.bind(null, recipientId),
    undefined
  );

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors"
      >
        Send Message
      </button>
    );
  }

  if (state?.success) {
    return (
      <div className="bg-primary-light border border-primary/30 rounded-lg p-4 text-center">
        <p className="text-primary font-medium">Message sent - thank you!</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="bg-card border border-border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-navy text-sm">Send a message to {recipientName}</h3>
      <textarea
        name="message"
        required
        rows={4}
        placeholder="Write your message..."
        className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-60"
        >
          {pending ? "Sending..." : "Send"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted hover:text-navy">
          Cancel
        </button>
      </div>
    </form>
  );
}
