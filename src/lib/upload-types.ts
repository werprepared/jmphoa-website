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

/** Largest file the Admin > Documents form will accept (uploaded straight to Blob, not through a function). */
export const DIRECT_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;

/** Browsers on machines without an ODF app often report .odt files as empty/octet-stream. */
export function resolveFileType(fileName: string, reportedType: string) {
  const isGeneric = !reportedType || reportedType === "application/octet-stream";
  return isGeneric && fileName.toLowerCase().endsWith(".odt") ? ODT_TYPE : reportedType;
}
