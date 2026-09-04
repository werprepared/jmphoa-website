"use client";

import { useTransition } from "react";
import { setUserRoleAction } from "./actions";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@prisma/client";

export default function RoleSelect({ userId, role }: { userId: string; role: Role }) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={role}
      disabled={pending}
      onChange={(e) => startTransition(() => setUserRoleAction(userId, e.target.value as Role))}
      className="border border-border rounded px-2 py-1 text-sm bg-white disabled:opacity-60"
    >
      {ALL_ROLES.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS[r]}
        </option>
      ))}
    </select>
  );
}
