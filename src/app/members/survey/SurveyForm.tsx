"use client";

import { useActionState } from "react";
import { submitSurveyAction, type SurveyState } from "./actions";

export default function SurveyForm({ questions }: { questions: { id: string; question: string }[] }) {
  const [state, formAction, pending] = useActionState<SurveyState, FormData>(submitSurveyAction, undefined);

  if (state?.success) {
    return <p className="text-primary font-medium">Thanks for your feedback!</p>;
  }

  return (
    <form action={formAction} className="space-y-5">
      {questions.map((q) => (
        <div key={q.id}>
          <label className="block text-sm font-medium mb-1" htmlFor={`q_${q.id}`}>
            {q.question}
          </label>
          <textarea
            id={`q_${q.id}`}
            name={`q_${q.id}`}
            rows={3}
            className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      ))}
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-primary hover:bg-primary-dark text-white font-medium px-6 py-2 rounded transition-colors disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit response"}
      </button>
    </form>
  );
}
