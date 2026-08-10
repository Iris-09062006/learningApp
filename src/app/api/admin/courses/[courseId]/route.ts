import { NextResponse } from "next/server";

import { adminErrorResponse } from "@/app/api/admin/admin-route-utils";
import { deleteAdminCourse, parseCourseId } from "@/features/admin/services/admin-service";

export const runtime = "nodejs";

interface RouteContext { params: Promise<{ courseId: string }> }

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const courseId = parseCourseId((await context.params).courseId);
    return NextResponse.json({ success: true, data: await deleteAdminCourse(courseId) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
