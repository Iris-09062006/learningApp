import { NextResponse } from "next/server";

import { adminErrorResponse } from "@/app/api/admin/admin-route-utils";
import { listAdminCourses } from "@/features/admin/services/admin-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: { items: await listAdminCourses() } });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
