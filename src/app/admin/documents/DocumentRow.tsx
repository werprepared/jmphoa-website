"use client";

import { useState } from "react";
import { format } from "date-fns";
import { renameDocumentAction, deleteDocumentAction } from "./actions";

export default function DocumentRow({
  id,
  title,
  fileUrl,
  createdAt,
}: {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: Date;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="flex items-center gap-2 px-4 py-3 bg-card">
        <form
          action={async (formData: FormData) => {
            await renameDocumentAction(id, String(formData.get("title") || ""));
            setEditing(false);
          }}
          className="flex items-center gap-2 flex-1"
        >
          <input
            name="title"
            defaultValue={title}
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
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between px-4 py-3 bg-card">
      <div>
        <a href={fileUrl} target="_blank" rel="noreferrer" className="font-medium text-navy hover:underline">
          {title}
        </a>
        <div className="text-xs text-muted">{format(createdAt, "MMM d, yyyy")}</div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button onClick={() => setEditing(true)} className="text-xs text-muted hover:text-primary">
          Rename
        </button>
        <form action={async () => { await deleteDocumentAction(id); }}>
          <button className="text-xs text-muted hover:text-red-600">Delete</button>
        </form>
      </div>
    </li>
  );
}
