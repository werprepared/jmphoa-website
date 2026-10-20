import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/authz";
import { uploadableCategoriesForRole } from "@/lib/roles";
import { ALLOWED_DOC_TYPES, DIRECT_UPLOAD_MAX_BYTES } from "@/lib/upload-types";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await getCurrentUser();
        if (!user || user.status !== "APPROVED" || uploadableCategoriesForRole(user.roles).length === 0) {
          throw new Error("You don't have permission to upload documents.");
        }
        return {
          allowedContentTypes: ALLOWED_DOC_TYPES,
          maximumSizeInBytes: DIRECT_UPLOAD_MAX_BYTES,
        };
      },
    });
    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
