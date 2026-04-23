import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    console.log(
      "has BLOB_READ_WRITE_TOKEN:",
      Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    );

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        console.log("generate token for pathname:", pathname);

        return {
          allowedContentTypes: [
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "video/x-matroska",
          ],
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Blob uploaded:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("blob upload route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "upload error",
      },
      { status: 400 },
    );
  }
}