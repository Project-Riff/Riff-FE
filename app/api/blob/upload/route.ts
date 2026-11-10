import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  // 업로드 토큰 발급은 관리자만. 업로드 완료 알림은 Vercel이 서명해서 보내므로 그대로 둔다.
  if (body.type === "blob.generate-client-token" && !(await isAdminRequest(request))) {
    return NextResponse.json(
      { error: "관리자 로그인이 필요합니다." },
      { status: 401 },
    );
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        return {
          allowedContentTypes: [
            "video/mp4",
            "video/quicktime",
            "video/webm",
            "video/x-matroska",
          ],
          addRandomSuffix: true,
          tokenPayload: clientPayload,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log("Blob uploaded:", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "upload error" },
      { status: 400 },
    );
  }
}