import { NextResponse } from "next/server";

import { adminErrorResponse } from "@/app/api/admin/admin-route-utils";
import {
  parseUserId,
  sendAdminPasswordRecovery,
} from "@/features/admin/services/admin-service";

export const runtime = "nodejs";

interface RouteContext { params: Promise<{ userId: string }> }

export async function POST(_request: Request, context: RouteContext) {
  try {
    const userId = parseUserId((await context.params).userId);
    return NextResponse.json({ success: true, data: await sendAdminPasswordRecovery(userId) });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
