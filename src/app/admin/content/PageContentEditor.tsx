"use client";

import { useActionState } from "react";
import RichTextEditor from "@/components/RichTextEditor";
import { savePageContentAction, type ContentState } from "./actions";

type Block = { title: string | null; body: string | null; imageUrl: string | null } | null;

export default function PageContentEditor({
  contentKey,
  label,
  block,
  imageLabel = "Photo",
}: {
  contentKey: string;
  label: string;
  block: Block;
  imageLabel?: string;
}) {
  const action = savePageContentAction.bind(null, contentKey);
  const [state, formAction, pending] = useActionState<ContentState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-4 bg-card border border-border rounded-lg p-5">
      <h2 className="font-semibold text-navy">{label}</h2>
      <div>
        <label className="block text-sm font-medium mb-1">Heading</label>
        <input
          name="title"
          defaultValue={block?.title || ""}
          className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Body text</label>
        <RichTextEditor name="body" defaultValue={block?.body} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{imageLabel}</label>
        {block?.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.imageUrl} alt="" className="h-32 w-auto rounded mb-2 border border-border object-cover" />
        )}
        <input type="file" name="image" accept="image/*" className="text-sm" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-primary">Saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-primary hover:bg-primary-dark text-white font-medium px-5 py-2 rounded transition-colors disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
