"use client";

import { useTransition } from "react";
import { assignBoardPositionAction } from "../actions";

export default function BoardAssignSelect({
  positionId,
  currentUserId,
  users,
}: {
  positionId: string;
  currentUserId: string | null;
  users: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={currentUserId || ""}
      disabled={pending}
      onChange={(e) => startTransition(() => assignBoardPositionAction(positionId, e.target.value))}
      className="border border-border rounded px-2 py-1 text-sm bg-white disabled:opacity-60"
    >
      <option value="">Vacant</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </select>
  );
}
