"use client";

import { useState } from "react";
import { updateFaqAction, deleteFaqAction } from "../actions";
import RichTextEditor from "@/components/RichTextEditor";
import RichText from "@/components/RichText";

export default function FaqRow({ id, question, answer }: { id: string; question: string; answer: string }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData: FormData) => {
          await updateFaqAction(id, String(formData.get("question") || ""), String(formData.get("answer") || ""));
          setEditing(false);
        }}
        className="bg-card border border-border rounded-lg p-4 space-y-2"
      >
        <input
          name="question"
          defaultValue={question}
          autoFocus
          required
          className="w-full border border-border rounded px-3 py-2 text-sm"
        />
        <RichTextEditor name="answer" defaultValue={answer} />
        <div className="flex gap-3">
          <button type="submit" className="text-xs font-medium text-primary hover:underline">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted hover:text-navy">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 flex justify-between gap-4">
      <div>
        <div className="font-medium text-navy">{question}</div>
        <RichText html={answer} className="text-sm text-muted mt-1" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={() => setEditing(true)} className="text-xs text-muted hover:text-primary">
          Edit
        </button>
        <form action={async () => { await deleteFaqAction(id); }}>
          <button className="text-xs text-muted hover:text-red-600">Delete</button>
        </form>
      </div>
    </div>
  );
}
