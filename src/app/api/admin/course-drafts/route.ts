import { NextResponse } from "next/server";

import { contentPipelineErrorResponse } from "@/app/api/admin/content-pipeline-route-utils";
import { getCourseDraftQueue } from "@/features/content-pipeline/services/content-pipeline-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(
      { success: true, data: { items: await getCourseDraftQueue() } },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return contentPipelineErrorResponse(error);
  }
}
