import { NextResponse } from "next/server";

import { contentPipelineErrorResponse, readPipelineJson } from "@/app/api/admin/content-pipeline-route-utils";
import { getLessonDraftDetail, updateCourseLessonContent, updateLessonDraft } from "@/features/content-pipeline/services/content-pipeline-service";

export const runtime = "nodejs";
interface RouteContext { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  try {
    return NextResponse.json(
      { success: true, data: await getLessonDraftDetail((await context.params).id) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return contentPipelineErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const body = await readPipelineJson(request);
    const courseImport = Boolean(body && typeof body === "object" && !Array.isArray(body)
      && (body as Record<string, unknown>).pipeline === "course_import");
    const draftBody = courseImport && body && typeof body === "object" && !Array.isArray(body)
      ? Object.fromEntries(Object.entries(body as Record<string, unknown>).filter(([key]) => key !== "pipeline"))
      : body;
    return NextResponse.json(
      { success: true, data: courseImport
        ? await updateCourseLessonContent((await context.params).id, draftBody)
        : await updateLessonDraft((await context.params).id, draftBody) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return contentPipelineErrorResponse(error);
  }
}
