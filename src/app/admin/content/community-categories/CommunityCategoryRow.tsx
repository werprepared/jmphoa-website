"use client";

import { useState } from "react";
import {
  renameCommunityCategoryAction,
  deleteCommunityCategoryAction,
  moveCommunityCategoryAction,
} from "../actions";

export default function CommunityCategoryRow({
  id,
  name,
  isFirst,
  isLast,
}: {
  id: string;
  name: string;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <form
        action={async (formData: FormData) => {
          await renameCommunityCategoryAction(id, String(formData.get("name") || ""));
          setEditing(false);
        }}
        className="flex items-center gap-2 bg-card border border-border rounded-lg p-3"
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
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-muted hover:text-navy shrink-0">
          Cancel
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 bg-card border border-border rounded-lg p-3">
      <span className="font-medium text-navy">{name}</span>
      <div className="flex items-center gap-3 shrink-0">
        <form action={async () => { await moveCommunityCategoryAction(id, "up"); }}>
          <button disabled={isFirst} className="text-xs text-muted hover:text-primary disabled:opacity-30">▲</button>
        </form>
        <form action={async () => { await moveCommunityCategoryAction(id, "down"); }}>
          <button disabled={isLast} className="text-xs text-muted hover:text-primary disabled:opacity-30">▼</button>
        </form>
        <button onClick={() => setEditing(true)} className="text-xs text-muted hover:text-primary">
          Rename
        </button>
        <form action={async () => { await deleteCommunityCategoryAction(id); }}>
          <button className="text-xs text-muted hover:text-red-600">Delete</button>
        </form>
      </div>
    </div>
  );
}
