"use client";

import { useMemo, useState } from "react";

type Entry = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  children: string | null;
  pets: string | null;
  interests: string | null;
  workInfo: string | null;
};

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="text-sm">
      <span className="text-muted">{label}: </span>
      <span className="text-navy">{value}</span>
    </div>
  );
}

export default function DirectoryList({ entries }: { entries: Entry[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.address?.toLowerCase().includes(q) ||
        e.interests?.toLowerCase().includes(q)
    );
  }, [entries, query]);

  return (
    <div>
      <input
        type="search"
        placeholder="Search by name, address, or interest..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border border-border rounded px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {filtered.length === 0 ? (
        <p className="text-muted">No members found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((e) => (
            <div key={e.id} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <div className="font-semibold text-navy">{e.name}</div>
              <Field label="Address" value={e.address} />
              <Field label="Phone" value={e.phone} />
              <Field label="Email" value={e.email} />
              <Field label="Children" value={e.children} />
              <Field label="Pets" value={e.pets} />
              <Field label="Interests" value={e.interests} />
              <Field label="Work" value={e.workInfo} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
