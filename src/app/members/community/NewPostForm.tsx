"use client";

import { useActionState, useRef } from "react";
import { createPostAction, type PostState } from "./actions";

export default function NewPostForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<PostState, FormData>(async (prev, fd) => {
    const result = await createPostAction(prev, fd);
    if (!result?.error) formRef.current?.reset();
    return result;
  }, undefined);

  return (
    <form ref={formRef} action={formAction} className="bg-card border border-border rounded-lg p-4 mb-8">
      <textarea
        name="body"
        required
        rows={3}
        placeholder="Share something with your neighbors..."
        className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="flex items-center justify-between mt-2">
        <input type="file" name="photo" accept="image/*" className="text-xs" />
        <button
          type="submit"
          disabled={pending}
          className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-60"
        >
          {pending ? "Posting..." : "Post"}
        </button>
      </div>
      {state?.error && <p className="text-sm text-red-600 mt-2">{state.error}</p>}
    </form>
  );
}
