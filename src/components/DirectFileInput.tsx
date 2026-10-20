"use client";

import { Fragment, useEffect, useRef, useState, type ChangeEvent } from "react";
import { upload } from "@vercel/blob/client";
import { allowedTypesFor, maxDirectBytesFor, resolveFileType, type UploadKind } from "@/lib/upload-types";

// Vercel rejects function requests over 4.5MB, so only smaller files can fall back to posting the raw file.
const FALLBACK_MAX_BYTES = 4 * 1024 * 1024;

type Uploaded = { url: string; name: string; type: string };

/**
 * A file picker that uploads each chosen file straight to Vercel Blob right away, then submits only the links
 * with the surrounding form (as `${name}Url`, `${name}Name`, `${name}Type`; read them with readUploads()).
 * This avoids Vercel's 4.5MB limit on request bodies. If direct upload isn't available (e.g. local dev) and the
 * files are small, it falls back to posting the raw files under `name`.
 */
export default function DirectFileInput({
  name,
  kind,
  accept,
  multiple,
  required,
  id,
  className = "text-sm",
}: {
  name: string;
  kind: UploadKind;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<Uploaded[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postRaw, setPostRaw] = useState(false);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setUploaded([]);
      setError(null);
      setPostRaw(false);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  function block(message: string) {
    inputRef.current?.setCustomValidity(message);
  }

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const files = Array.from(input.files ?? []);
    setUploaded([]);
    setPostRaw(false);
    setError(null);
    input.setCustomValidity("");
    if (files.length === 0) return;

    const allowed = allowedTypesFor(kind);
    const maxBytes = maxDirectBytesFor(kind);
    for (const file of files) {
      const type = resolveFileType(file.name, file.type);
      if (!allowed.includes(type)) {
        setError(`"${file.name}" is not a supported file type.`);
        input.value = "";
        return;
      }
      if (file.size > maxBytes) {
        setError(`"${file.name}" is too large (${Math.round(maxBytes / 1024 / 1024)}MB max).`);
        input.value = "";
        return;
      }
    }

    setUploading(true);
    block("Please wait for the upload to finish.");
    try {
      const results: Uploaded[] = [];
      for (const file of files) {
        const type = resolveFileType(file.name, file.type);
        const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
        const blob = await upload(`${crypto.randomUUID()}${extension}`, file, {
          access: "public",
          handleUploadUrl: "/api/uploads",
          clientPayload: kind,
          contentType: type,
        });
        results.push({ url: blob.url, name: file.name, type });
      }
      setUploaded(results);
    } catch (err) {
      if (files.every((f) => f.size <= FALLBACK_MAX_BYTES)) {
        setPostRaw(true);
      } else {
        setError(err instanceof Error ? `Upload failed: ${err.message}` : "Upload failed. Please try again.");
        input.value = "";
      }
    } finally {
      setUploading(false);
      input.setCustomValidity("");
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        id={id}
        type="file"
        name={postRaw ? name : undefined}
        accept={accept}
        multiple={multiple}
        required={required}
        onChange={handleChange}
        className={className}
      />
      {uploaded.map((f, i) => (
        <Fragment key={`${f.url}-${i}`}>
          <input type="hidden" name={`${name}Url`} value={f.url} />
          <input type="hidden" name={`${name}Name`} value={f.name} />
          <input type="hidden" name={`${name}Type`} value={f.type} />
        </Fragment>
      ))}
      {uploading && <span className="text-xs text-muted ml-2">Uploading...</span>}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </>
  );
}
