"use client";

import { useState } from "react";
import Link from "next/link";
import { renameFolderAction, deleteFolderAction } from "./actions";

export default function FolderRow({
  id,
  name,
  href,
}: {
  id: string;
  name: string;
  href: string;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData: FormData) => {
          await renameFolderAction(id, String(formData.get("name") || ""));
          setEditing(false);
        }}
        className="flex items-center gap-2 bg-card border border-border rounded-lg p-4"
      >
        <input
          name="name"
          defaultValue={name}
          autoFocus
          required
          className="flex-1 min-w-0 border border-border rounded px-2 py-1 text-sm"
        />
        <button type="submit" className="text-xs font-medium text-primary hover:underline shrink-0">
          Save
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-muted hover:text-navy shrink-0"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 bg-card border border-border rounded-lg p-4">
      <Link href={href} className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-2xl" aria-hidden>
          📁
        </span>
        <span className="font-medium text-navy truncate">{name}</span>
      </Link>
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={() => setEditing(true)} className="text-xs text-muted hover:text-primary">
          Rename
        </button>
        <form action={async () => { await deleteFolderAction(id); }}>
          <button className="text-xs text-muted hover:text-red-600">Delete</button>
        </form>
      </div>
    </div>
  );
}
