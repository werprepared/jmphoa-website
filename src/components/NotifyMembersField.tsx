"use client";

import { useState } from "react";

export default function NotifyMembersField({ members }: { members: { id: string; name: string }[] }) {
  const [enabled, setEnabled] = useState(false);
  const [scope, setScope] = useState<"all" | "selected">("all");

  return (
    <div className="border border-border rounded p-3 bg-white">
      <label className="flex items-center gap-2 text-sm font-medium text-navy">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Email members about this
      </label>
      <input type="hidden" name="notifyScope" value={enabled ? scope : "none"} />

      {enabled && (
        <div className="pl-6 mt-2 space-y-2">
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={scope === "all"} onChange={() => setScope("all")} />
              All members
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" checked={scope === "selected"} onChange={() => setScope("selected")} />
              Select members
            </label>
          </div>

          {scope === "selected" && (
            <div className="max-h-40 overflow-auto border border-border rounded p-2 space-y-1">
              {members.length === 0 ? (
                <p className="text-xs text-muted">No approved members yet.</p>
              ) : (
                members.map((m) => (
                  <label key={m.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="notifyUserIds" value={m.id} />
                    {m.name}
                  </label>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
