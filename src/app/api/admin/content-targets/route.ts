import { NextResponse } from "next/server";

import { contentPipelineErrorResponse, readPipelineJson } from "@/app/api/admin/content-pipeline-route-utils";
import { createNewContentTarget, getContentTargets } from "@/features/content-pipeline/services/content-pipeline-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(
      { success: true, data: await getContentTargets() },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return contentPipelineErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    return NextResponse.json(
      { success: true, data: await createNewContentTarget(await readPipelineJson(request)) },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return contentPipelineErrorResponse(error);
  }
}
