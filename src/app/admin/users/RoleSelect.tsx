"use client";

import { useTransition } from "react";
import { setUserRolesAction } from "./actions";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@prisma/client";

export default function RoleSelect({ userId, roles }: { userId: string; roles: Role[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <select
        multiple
        size={ALL_ROLES.length}
        defaultValue={roles}
        disabled={pending}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions).map((o) => o.value as Role);
          startTransition(() => setUserRolesAction(userId, selected));
        }}
        className="border border-border rounded px-2 py-1 text-sm bg-white disabled:opacity-60 min-w-48"
      >
        {ALL_ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted mt-1">Ctrl/Cmd-click (or Shift-click) to select more than one.</p>
    </div>
  );
}
