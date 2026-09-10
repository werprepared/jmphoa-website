import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { put } from "@vercel/blob";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
];

const MAX_BYTES = 15 * 1024 * 1024; // 15MB

export class UploadError extends Error {}

/**
 * Vercel's filesystem is read-only/ephemeral in production, so uploads go to Vercel Blob
 * whenever it's configured (BLOB_READ_WRITE_TOKEN is set). Falls back to writing into
 * public/uploads for local dev, where no Blob store is set up.
 */
async function saveFile(file: File, allowed: string[]) {
  if (!allowed.includes(file.type)) {
    throw new UploadError(`File type "${file.type}" is not allowed.`);
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

export function saveDocument(file: File) {
  return saveFile(file, ALLOWED_DOC_TYPES);
}
