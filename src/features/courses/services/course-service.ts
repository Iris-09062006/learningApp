import {
  fetchCourseSummaries,
  fetchCourseDetail,
} from "@/features/courses/repositories/course-repository";
import type { CourseListResult, CourseDetail } from "@/features/courses/types";

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