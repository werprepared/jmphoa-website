import "server-only";
import { list, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

// Files newer than this are never offered for deletion: an upload may still be waiting for its form to be submitted.
export const MIN_AGE_MS = 24 * 60 * 60 * 1000;

const BLOB_URL_RE = /https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^\s"'<>)\]\\]+/gi;
const DELETE_CHUNK = 100;

export type BlobInfo = { url: string; pathname: string; size: number; uploadedAt: Date };

export type BlobPartition = {
  inUse: BlobInfo[];
  /** Unreferenced but too new to delete safely. */
  recent: BlobInfo[];
  /** Unreferenced and older than the minimum age. */
  deletable: BlobInfo[];
};

export function isBlobConfigured() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function listAllBlobs(): Promise<BlobInfo[]> {
  const blobs: BlobInfo[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, limit: 1000, token: process.env.BLOB_READ_WRITE_TOKEN });
    for (const b of page.blobs) blobs.push({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: b.uploadedAt });
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

/**
 * Every file link stored anywhere in the database. Scans every text/JSON column (not a hand-picked list) so links
 * inside rich text such as FAQ answers, posts and event descriptions, and any column added later, still count as in use.
 */
async function referencedPathnames(): Promise<Set<string>> {
  const columns = await prisma.$queryRaw<{ table_name: string; column_name: string }[]>`
    SELECT table_name, column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND data_type IN ('text', 'character varying', 'json', 'jsonb')`;
  const quote = (id: string) => `"${id.replace(/"/g, '""')}"`;
  const selects = columns.map(
    ({ table_name, column_name }) =>
      `SELECT ${quote(column_name)}::text AS v FROM ${quote(table_name)} WHERE ${quote(column_name)}::text LIKE '%.public.blob.vercel-storage.com%'`,
  );

  const referenced = new Set<string>();
  if (selects.length === 0) return referenced;
  const rows = await prisma.$queryRawUnsafe<{ v: string }[]>(selects.join(" UNION ALL "));
  for (const { v } of rows) {
    for (const match of v.matchAll(BLOB_URL_RE)) {
      try {
        referenced.add(decodeURIComponent(new URL(match[0]).pathname.slice(1)));
      } catch {
        // Not a parsable link; ignore.
      }
    }
  }
  return referenced;
}

export function partitionBlobs(blobs: BlobInfo[], referenced: Set<string>, now: Date, minAgeMs: number): BlobPartition {
  const result: BlobPartition = { inUse: [], recent: [], deletable: [] };
  for (const blob of blobs) {
    if (referenced.has(blob.pathname)) result.inUse.push(blob);
    else if (now.getTime() - blob.uploadedAt.getTime() < minAgeMs) result.recent.push(blob);
    else result.deletable.push(blob);
  }
  return result;
}

export async function getBlobReport(minAgeMs = MIN_AGE_MS): Promise<BlobPartition> {
  const [blobs, referenced] = await Promise.all([listAllBlobs(), referencedPathnames()]);
  return partitionBlobs(blobs, referenced, new Date(), minAgeMs);
}

/**
 * Deletes unreferenced files. The set is always recomputed here, never taken from the caller, so a file that has
 * become referenced (or is too new) since the page was shown is left alone. `only` narrows it to specific pathnames.
 */
export async function deleteUnreferencedBlobs({
  only,
  minAgeMs = MIN_AGE_MS,
}: { only?: string[]; minAgeMs?: number } = {}) {
  const { deletable } = await getBlobReport(minAgeMs);
  const targets = only ? deletable.filter((b) => only.includes(b.pathname)) : deletable;

  for (let i = 0; i < targets.length; i += DELETE_CHUNK) {
    await del(targets.slice(i, i + DELETE_CHUNK).map((b) => b.url), { token: process.env.BLOB_READ_WRITE_TOKEN });
  }
  return { deleted: targets.length, bytes: targets.reduce((sum, b) => sum + b.size, 0) };
}
