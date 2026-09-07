"use client";

import { useActionState, useRef, useState } from "react";
import { createSurveyAction, type SurveyState } from "./actions";
import NotifyMembersField from "@/components/NotifyMembersField";

export default function NewSurveyForm({ members }: { members: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<SurveyState, FormData>(async (prev, fd) => {
    const result = await createSurveyAction(prev, fd);
    if (!result?.error) {
      formRef.current?.reset();
      setOpen(false);
    }
    return result;
  }, undefined);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mb-8 bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors"
      >
        + Create a survey
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="bg-card border border-border rounded-lg p-4 mb-8 space-y-3">
      <input
        name="title"
        required
        placeholder="Survey title or statement to vote on"
        className="w-full border border-border rounded px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <textarea
        name="description"
        rows={2}
        placeholder="Additional details (optional)"
        className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="attachment">
          Attach a document or picture (optional)
        </label>
        <input id="attachment" name="attachment" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,image/jpeg,image/png" className="text-sm" />
      </div>
      <NotifyMembersField members={members} />
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted hover:text-navy">
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create survey"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
