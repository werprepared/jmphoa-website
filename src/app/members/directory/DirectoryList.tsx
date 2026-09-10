"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Entry = {
  id: string;
  name: string;
  address: string | null;
  photoUrl: string | null;
};

function Avatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-border shrink-0" />
    );
  }
  const initials = name
    .split(/,\s*/)
    .reverse()
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join("")
    .toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-primary-light text-primary text-sm font-semibold flex items-center justify-center shrink-0">
      {initials}
    </div>
  );
}

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
              <Link href={`/members/directory/${e.id}`} className="flex items-center gap-3 min-w-0">
                <Avatar name={e.name} photoUrl={e.photoUrl} />
                <span className="font-medium text-primary hover:underline truncate">{e.name}</span>
              </Link>
              {e.address && <span className="text-sm text-muted text-right shrink-0">{e.address}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
