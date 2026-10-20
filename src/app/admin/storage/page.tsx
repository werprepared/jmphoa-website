import { format } from "date-fns";
import { requireRole } from "@/lib/authz";
import { getBlobReport, isBlobConfigured, type BlobInfo } from "@/lib/blob-usage";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { deleteAllUnreferencedAction, deleteOneUnreferencedAction } from "./actions";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const totalBytes = (blobs: BlobInfo[]) => blobs.reduce((sum, b) => sum + b.size, 0);

function FileRow({ blob, canDelete }: { blob: BlobInfo; canDelete: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 px-4 py-2 bg-card text-sm">
      <div className="min-w-0">
        <a href={blob.url} target="_blank" rel="noreferrer" className="text-primary hover:underline font-mono text-xs break-all">
          {blob.pathname}
        </a>
        <div className="text-xs text-muted">
          {formatBytes(blob.size)} · uploaded {format(blob.uploadedAt, "MMM d, yyyy h:mm a")}
        </div>
      </div>
      {canDelete && (
        <ConfirmDeleteButton
          action={deleteOneUnreferencedAction.bind(null, blob.pathname)}
          confirmMessage="Delete this file from storage? This cannot be undone."
        />
      )}
    </li>
  );
}

export default async function StorageCleanupPage() {
  await requireRole("ADMIN");

  if (!isBlobConfigured()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-navy">Storage Cleanup</h1>
        <p className="text-muted text-sm">File storage (Vercel Blob) isn't configured in this environment, so there is nothing to clean up.</p>
      </div>
    );
  }

  const { inUse, recent, deletable } = await getBlobReport();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Storage Cleanup</h1>
        <p className="text-sm text-muted mt-1">
          Files are uploaded as soon as they are chosen in a form, so a file that was picked but never saved stays in storage.
          This page finds files that no part of the site links to and lets you delete them. Files uploaded in the last 24 hours
          are never offered for deletion.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-3xl font-bold text-navy">{inUse.length}</div>
          <div className="text-sm text-muted mt-1">In use ({formatBytes(totalBytes(inUse))})</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-3xl font-bold text-navy">{deletable.length}</div>
          <div className="text-sm text-muted mt-1">Unused, safe to delete ({formatBytes(totalBytes(deletable))})</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="text-3xl font-bold text-navy">{recent.length}</div>
          <div className="text-sm text-muted mt-1">Unused but too new to delete ({formatBytes(totalBytes(recent))})</div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-navy text-sm">Unused files</h2>
          {deletable.length > 0 && (
            <ConfirmDeleteButton
              action={deleteAllUnreferencedAction}
              label={`Delete all ${deletable.length} unused file${deletable.length === 1 ? "" : "s"}`}
              confirmMessage={`Permanently delete ${deletable.length} unused file${deletable.length === 1 ? "" : "s"} (${formatBytes(totalBytes(deletable))}) from storage? This cannot be undone.`}
              className="text-sm bg-red-600 hover:bg-red-700 text-white font-medium px-3 py-1.5 rounded"
            />
          )}
        </div>
        {deletable.length === 0 ? (
          <p className="text-muted text-sm">No unused files. Storage is clean.</p>
        ) : (
          <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {deletable.map((b) => (
              <FileRow key={b.pathname} blob={b} canDelete />
            ))}
          </ul>
        )}
      </div>

      {recent.length > 0 && (
        <div>
          <h2 className="font-semibold text-navy text-sm mb-3">Unused, but uploaded in the last 24 hours</h2>
          <p className="text-xs text-muted mb-3">These may belong to a form someone is still filling in. Check again tomorrow.</p>
          <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
            {recent.map((b) => (
              <FileRow key={b.pathname} blob={b} canDelete={false} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
