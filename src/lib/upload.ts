import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import { ALLOWED_DOC_TYPES, ALLOWED_IMAGE_TYPES, allowedTypesFor, resolveFileType, type UploadKind } from "@/lib/upload-types";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const MAX_BYTES = 15 * 1024 * 1024; // 15MB

export class UploadError extends Error {}

/**
 * Vercel's filesystem is read-only/ephemeral in production, so uploads go to Vercel Blob
 * whenever it's configured (BLOB_READ_WRITE_TOKEN is set). Falls back to writing into
 * public/uploads for local dev, where no Blob store is set up.
 */
async function saveFile(file: File, allowed: string[]) {
  const type = resolveFileType(file.name, file.type);
  if (!allowed.includes(type)) {
    throw new UploadError(`File type "${type}" is not allowed.`);
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("File is too large (15MB max).");
  }

  const ext = path.extname(file.name) || "";
  const filename = `${randomUUID()}${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(filename, file, {
        access: "public",
        contentType: type,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return blob.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new UploadError(`Upload failed: ${message}`);
    }
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/${filename}`;
}

export function saveImage(file: File) {
  return saveFile(file, ALLOWED_IMAGE_TYPES);
}

/** True only for files that were uploaded to this site's own Vercel Blob store. */
export function isTrustedBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export function saveDocument(file: File) {
  return saveFile(file, ALLOWED_DOC_TYPES);
}

export type UploadedFile = { url: string; name: string; type: string };

/**
 * Collects the files submitted for a form field. Files the browser already uploaded straight to Blob arrive as
 * `${field}Url` / `${field}Name` / `${field}Type` entries; anything posted as a raw file (small-file fallback)
 * is saved here. Throws UploadError if a submitted link or type can't be trusted.
 */
export async function readUploads(formData: FormData, field: string, kind: UploadKind): Promise<UploadedFile[]> {
  const urls = formData.getAll(`${field}Url`).map(String);
  const names = formData.getAll(`${field}Name`).map(String);
  const types = formData.getAll(`${field}Type`).map(String);
  const allowed = allowedTypesFor(kind);

  const results: UploadedFile[] = [];
  urls.forEach((url, i) => {
    if (!url) return;
    if (!isTrustedBlobUrl(url) || !allowed.includes(types[i])) {
      throw new UploadError("That upload could not be verified. Please try again.");
    }
    results.push({ url, name: names[i] || "file", type: types[i] });
  });

  for (const file of formData.getAll(field)) {
    if (!(file instanceof File) || file.size === 0) continue;
    const url = await (kind === "image" ? saveImage(file) : saveDocument(file));
    results.push({ url, name: file.name, type: resolveFileType(file.name, file.type) });
  }
  return results;
}
