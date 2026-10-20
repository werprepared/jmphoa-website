"use client";

import { useActionState, useState, useTransition, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { uploadDocumentAction, type UploadDocState } from "./actions";
import NotifyMembersField from "@/components/NotifyMembersField";
import { ALLOWED_DOC_TYPES, DIRECT_UPLOAD_MAX_BYTES, resolveFileType } from "@/lib/upload-types";
import type { DocCategory } from "@prisma/client";

// Vercel rejects function requests over 4.5MB, so smaller files can safely fall back to the server action.
const SERVER_ACTION_MAX_BYTES = 4 * 1024 * 1024;

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
  const [, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setClientError(null);
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file");

    if (file instanceof File && file.size > 0) {
      const type = resolveFileType(file.name, file.type);
      if (!ALLOWED_DOC_TYPES.includes(type)) {
        setClientError(`File type "${type || "unknown"}" is not allowed.`);
        return;
      }
      if (file.size > DIRECT_UPLOAD_MAX_BYTES) {
        setClientError("File is too large (50MB max).");
        return;
      }

      setUploading(true);
      try {
        const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
        const blob = await upload(`${crypto.randomUUID()}${extension}`, file, {
          access: "public",
          handleUploadUrl: "/api/documents/upload",
          contentType: type,
        });
        formData.delete("file");
        formData.set("fileUrl", blob.url);
        formData.set("fileType", type);
      } catch (err) {
        if (file.size > SERVER_ACTION_MAX_BYTES) {
          setClientError(err instanceof Error ? `Upload failed: ${err.message}` : "Upload failed. Please try again.");
          setUploading(false);
          return;
        }
        // Small file and direct upload unavailable (e.g. local dev): send it through the server action instead.
      }
      setUploading(false);
    }

    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-4 space-y-3">
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
      <input type="file" name="file" required className="text-sm" />
      <NotifyMembersField members={members} />
      {(clientError || state?.error) && <p className="text-sm text-red-600">{clientError ?? state?.error}</p>}
      <button
        type="submit"
        disabled={pending || uploading}
        className="bg-primary hover:bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded transition-colors disabled:opacity-60"
      >
        {pending || uploading ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}
