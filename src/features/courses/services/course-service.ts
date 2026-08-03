import {
  fetchCourseSummaries,
  fetchCourseDetail,
  enrollUserInCourse,
} from "@/features/courses/repositories/course-repository";
import type {
  CourseListResult,
  CourseDetail,
  EnrollCourseResult,
} from "@/features/courses/types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function normalizePagination(params: {
  page?: number | string | null;
  pageSize?: number | string | null;
}): { page: number; pageSize: number } {
  let page = Number(params.page);
  let pageSize = Number(params.pageSize);

  if (!Number.isFinite(page) || page < 1) page = DEFAULT_PAGE;
  if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = DEFAULT_PAGE_SIZE;
  if (pageSize > MAX_PAGE_SIZE) pageSize = MAX_PAGE_SIZE;

  return { page: Math.floor(page), pageSize: Math.floor(pageSize) };
}

export async function getPublishedCourses(params: {
  page?: number | string | null;
  pageSize?: number | string | null;
}): Promise<CourseListResult> {
  const { page, pageSize } = normalizePagination(params);
  return fetchCourseSummaries(page, pageSize);
}

export async function getCourseById(
  courseId: number
): Promise<CourseDetail | null> {
  if (!Number.isFinite(courseId) || courseId < 1) return null;
  const detail = await fetchCourseDetail(courseId);
  if (!detail) return null;
  // Only return published courses
  if (!detail.isPublished) return null;
  return detail;
}

export class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export async function enrollInCourse(
  courseId: number
): Promise<EnrollCourseResult> {
  if (!Number.isFinite(courseId) || courseId < 1) {
    throw new ServiceError("INVALID_ID", "Invalid course ID.", 400);
  }

  try {
    return await enrollUserInCourse(courseId);
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    const code = errorObj?.code;

    if (code === "28000") {
      throw new ServiceError("UNAUTHORIZED", "Authentication required.", 401);
    }
    if (code === "42501") {
      throw new ServiceError(
        "FORBIDDEN",
        "Active learner profile required.",
        403
      );
    }
    if (code === "P0002") {
      throw new ServiceError(
        "NOT_FOUND",
        "Course not found or not published.",
        404
      );
    }
    if (code === "23505") {
      throw new ServiceError(
        "ALREADY_ENROLLED",
        "You are already enrolled in this course.",
        409
      );
    }

    throw err;
  }
}
