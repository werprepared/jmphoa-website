"use client";

import { useActionState } from "react";
import { uploadDocumentAction, type UploadDocState } from "./actions";
import NotifyMembersField from "@/components/NotifyMembersField";
import DirectFileInput from "@/components/DirectFileInput";
import type { DocCategory } from "@prisma/client";

export default function UploadDocumentForm({
  category,
  folders,
  defaultFolderId,
  members,
}: {
  category: DocCategory;
  folders: { id: string; label: string }[];
  defaultFolderId: string;
  members: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<UploadDocState, FormData>(uploadDocumentAction, undefined);

  return (
    <form action={formAction} className="bg-card border border-border rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-navy text-sm">Upload a document</h3>
      <input type="hidden" name="category" value={category} />
      <div>
        <label htmlFor="folderId" className="block text-sm font-medium mb-1">Save to folder</label>
        <select id="folderId" name="folderId" defaultValue={defaultFolderId}
          className="w-full border border-border rounded px-3 py-2 text-sm bg-white">
          <option value="">HOA Documents (top level, no folder)</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>
      <input name="title" placeholder="Document title" required className="w-full border border-border rounded px-3 py-2 text-sm" />
      <DirectFileInput name="file" kind="document" required />
      <NotifyMembersField members={members} />
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
