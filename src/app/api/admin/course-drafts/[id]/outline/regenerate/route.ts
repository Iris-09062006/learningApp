import { NextResponse } from "next/server";

import { contentPipelineErrorResponse } from "@/app/api/admin/content-pipeline-route-utils";
import { regenerateCourseOutline } from "@/features/content-pipeline/services/content-pipeline-service";

export const runtime = "nodejs";
export const maxDuration = 60;
interface RouteContext { params: Promise<{ id: string }> }

export async function POST(_request: Request, context: RouteContext) {
  try {
    return NextResponse.json(
      { success: true, data: await regenerateCourseOutline((await context.params).id) },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return contentPipelineErrorResponse(error);
  }
}
