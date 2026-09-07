"use client";

import { useEffect, useRef, useState } from "react";
import { searchMembersAction, type MemberMatch } from "./actions";

export default function SpouseField({
  defaultName,
  defaultSpouseId,
}: {
  defaultName: string | null;
  defaultSpouseId: string | null;
}) {
  const [name, setName] = useState(defaultName ?? "");
  const [spouseId, setSpouseId] = useState<string | null>(defaultSpouseId);
  const [matches, setMatches] = useState<MemberMatch[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (spouseId) {
      // Text still matches the linked member exactly - no need to search.
      setMatches([]);
      return;
    }
    if (name.trim().length < 2) {
      setMatches([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const results = await searchMembersAction(name);
      setMatches(results);
      setOpen(results.length > 0);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, spouseId]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1" htmlFor="spouseName">
        Spouse name
      </label>
      <input
        id="spouseName"
        name="spouseName"
        value={name}
        autoComplete="off"
        placeholder="Start typing to find a registered member"
        onChange={(e) => {
          setName(e.target.value);
          setSpouseId(null);
        }}
        onFocus={() => matches.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <input type="hidden" name="spouseId" value={spouseId ?? ""} />

      {open && matches.length > 0 && (
        <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-border rounded shadow-lg max-h-48 overflow-auto">
          {matches.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setName(m.name);
                  setSpouseId(m.id);
                  setMatches([]);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-primary-light"
              >
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {spouseId ? (
        <p className="text-xs text-primary mt-1">
          ✓ Linked to {name}&apos;s profile.{" "}
          <button
            type="button"
            onClick={() => setSpouseId(null)}
            className="underline text-muted hover:text-navy"
          >
            Unlink
          </button>
        </p>
      ) : (
        name.trim().length >= 2 && (
          <p className="text-xs text-muted mt-1">
            Not linked to a member account &mdash; will show as plain text.
          </p>
        )
      )}
    </div>
  );
}
