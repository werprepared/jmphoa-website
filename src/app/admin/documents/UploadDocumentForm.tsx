"use client";

import { useActionState } from "react";
import { uploadDocumentAction, type UploadDocState } from "./actions";
import type { DocCategory } from "@prisma/client";

export default function UploadDocumentForm({
  category,
  folderId,
}: {
  category: DocCategory;
  folderId: string | null;
}) {
  const [state, formAction, pending] = useActionState<UploadDocState, FormData>(uploadDocumentAction, undefined);

  return (
    <form action={formAction} className="bg-card border border-border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-navy text-sm">Upload a document to this folder</h3>
      <input type="hidden" name="category" value={category} />
      <input type="hidden" name="folderId" value={folderId || ""} />
      <input name="title" placeholder="Document title" required className="w-full border border-border rounded px-3 py-2 text-sm" />
      <input type="file" name="file" required className="text-sm" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-60"
      >
        {pending ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}
