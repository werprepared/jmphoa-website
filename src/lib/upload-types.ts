export const ODT_TYPE = "application/vnd.oasis.opendocument.text";

export const ALLOWED_DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ODT_TYPE,
  "image/jpeg",
  "image/png",
];

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type UploadKind = "document" | "image";

export function allowedTypesFor(kind: UploadKind) {
  return kind === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_DOC_TYPES;
}

/** Largest file accepted when the browser uploads straight to Blob (it never passes through a function). */
export function maxDirectBytesFor(kind: UploadKind) {
  return kind === "image" ? 15 * 1024 * 1024 : 50 * 1024 * 1024;
}

/** Browsers on machines without an ODF app often report .odt files as empty/octet-stream. */
export function resolveFileType(fileName: string, reportedType: string) {
  const isGeneric = !reportedType || reportedType === "application/octet-stream";
  return isGeneric && fileName.toLowerCase().endsWith(".odt") ? ODT_TYPE : reportedType;
}
