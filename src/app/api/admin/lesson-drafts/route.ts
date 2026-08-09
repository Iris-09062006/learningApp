import { NextResponse } from "next/server";

import { contentPipelineErrorResponse } from "@/app/api/admin/content-pipeline-route-utils";
import { getLessonDraftQueue } from "@/features/content-pipeline/services/content-pipeline-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const status = new URL(request.url).searchParams.get("status") ?? undefined;
    return NextResponse.json(
      { success: true, data: { items: await getLessonDraftQueue(status) } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return contentPipelineErrorResponse(error);
  }
}
