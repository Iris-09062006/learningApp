import { NextRequest, NextResponse } from "next/server";
import { getPublishedCourses } from "@/features/courses/services/course-service";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const page = searchParams.get("page");
    const pageSize = searchParams.get("pageSize");

    const result = await getPublishedCourses({ page, pageSize });

    return NextResponse.json(
      {
        success: true,
        data: result.items,
        meta: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/courses]", err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "DATABASE_ERROR",
          message: "Failed to fetch courses.",
        },
      },
      { status: 500 }
    );
  }
}