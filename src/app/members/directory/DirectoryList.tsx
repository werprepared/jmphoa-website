"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Entry = {
  id: string;
  name: string;
  address: string | null;
};

export default function DirectoryList({ entries }: { entries: Entry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) => e.name.toLowerCase().includes(q) || e.address?.toLowerCase().includes(q)
    );
  }, [entries, query]);

  return (
    <div>
      <input
        type="search"
        placeholder="Search by name or address..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border border-border rounded px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {filtered.length === 0 ? (
        <p className="text-muted">No members found.</p>
      ) : (
        <ul className="divide-y divide-border border border-border rounded-lg overflow-hidden">
          {filtered.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-4 px-4 py-3 bg-card">
              <Link href={`/members/directory/${e.id}`} className="font-medium text-primary hover:underline">
                {e.name}
              </Link>
              {e.address && <span className="text-sm text-muted text-right">{e.address}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
