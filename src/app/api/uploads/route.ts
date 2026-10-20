import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/authz";
import { allowedTypesFor, maxDirectBytesFor, type UploadKind } from "@/lib/upload-types";

// Hands a signed-in member a one-time token so their browser can upload a file straight to Blob.
// Vercel rejects function request bodies over 4.5MB, so large files can't be posted through the forms.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const user = await getCurrentUser();
        if (!user || user.status !== "APPROVED") throw new Error("You must be signed in to upload files.");

        const kind: UploadKind = clientPayload === "image" ? "image" : "document";
        return {
          allowedContentTypes: allowedTypesFor(kind),
          maximumSizeInBytes: maxDirectBytesFor(kind),
        };
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
