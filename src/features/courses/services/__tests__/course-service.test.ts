import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchCourseDetail,
  fetchCourseSummaries,
  enrollUserInCourse,
} from "@/features/courses/repositories/course-repository";
import {
  enrollInCourse,
  getCourseById,
  getPublishedCourses,
  normalizePagination,
} from "@/features/courses/services/course-service";

vi.mock("@/features/courses/repositories/course-repository", () => ({
  fetchCourseSummaries: vi.fn(),
  fetchCourseDetail: vi.fn(),
  enrollUserInCourse: vi.fn(),
}));

describe("course service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("normalizes invalid and oversized pagination values", () => {
    expect(
      normalizePagination({ page: "abc", pageSize: "-5" }),
    ).toEqual({ page: 1, pageSize: 20 });

    expect(normalizePagination({ page: "2.8", pageSize: "200" })).toEqual({
      page: 2,
      pageSize: 100,
    });
  });

  it("delegates published course listing with normalized pagination", async () => {
    const result = {
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
      totalPages: 0,
    };
    vi.mocked(fetchCourseSummaries).mockResolvedValueOnce(result);

    await expect(
      getPublishedCourses({ page: "abc", pageSize: "-5" }),
    ).resolves.toEqual(result);
    expect(fetchCourseSummaries).toHaveBeenCalledWith(1, 20);
  });

  it("returns published course details", async () => {
    const detail = {
      id: 1,
      slug: "python-basic",
      title: "Python Basic",
      description: "Learn Python.",
      level: "beginner",
      language: "python",
      isPublished: true,
      chapterCount: 0,
      lessonCount: 0,
      isEnrolled: false,
      chapters: [],
    };
    vi.mocked(fetchCourseDetail).mockResolvedValueOnce(detail);

    await expect(getCourseById(1)).resolves.toEqual(detail);
    expect(fetchCourseDetail).toHaveBeenCalledWith(1);
  });

  it("returns null for invalid, missing, or unpublished courses", async () => {
    await expect(getCourseById(0)).resolves.toBeNull();
    expect(fetchCourseDetail).not.toHaveBeenCalled();

    vi.mocked(fetchCourseDetail).mockResolvedValueOnce(null);
    await expect(getCourseById(2)).resolves.toBeNull();

    vi.mocked(fetchCourseDetail).mockResolvedValueOnce({
      id: 3,
      slug: "draft",
      title: "Draft",
      description: null,
      level: "beginner",
      language: "python",
      isPublished: false,
      chapterCount: 0,
      lessonCount: 0,
      isEnrolled: false,
      chapters: [],
    });
    await expect(getCourseById(3)).resolves.toBeNull();
  });

  it("rejects invalid course IDs for enrollment", async () => {
    await expect(enrollInCourse(0)).rejects.toMatchObject({
      code: "INVALID_ID",
      statusCode: 400,
    });
    expect(enrollUserInCourse).not.toHaveBeenCalled();
  });

  it("delegates enrollment to the repository", async () => {
    const result = {
      enrollmentId: 11,
      courseId: 7,
      enrolledAt: "2026-03-08T10:00:00.000Z",
      firstLessonId: 42,
    };
    vi.mocked(enrollUserInCourse).mockResolvedValueOnce(result);

    await expect(enrollInCourse(7)).resolves.toEqual(result);
    expect(enrollUserInCourse).toHaveBeenCalledWith(7);
  });

  it("maps PostgreSQL error 23505 to ALREADY_ENROLLED (409)", async () => {
    vi.mocked(enrollUserInCourse).mockRejectedValueOnce({
      code: "23505",
      message: "Course enrollment already exists",
    });

    await expect(enrollInCourse(7)).rejects.toMatchObject({
      code: "ALREADY_ENROLLED",
      statusCode: 409,
    });
  });

  it("maps PostgreSQL error 28000 to UNAUTHORIZED (401)", async () => {
    vi.mocked(enrollUserInCourse).mockRejectedValueOnce({
      code: "28000",
      message: "Authentication required",
    });

    await expect(enrollInCourse(7)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      statusCode: 401,
    });
  });

  it("maps PostgreSQL error 42501 to FORBIDDEN (403)", async () => {
    vi.mocked(enrollUserInCourse).mockRejectedValueOnce({
      code: "42501",
      message: "Active learner profile required",
    });

    await expect(enrollInCourse(7)).rejects.toMatchObject({
      code: "FORBIDDEN",
      statusCode: 403,
    });
  });

  it("maps PostgreSQL error P0002 to NOT_FOUND (404)", async () => {
    vi.mocked(enrollUserInCourse).mockRejectedValueOnce({
      code: "P0002",
      message: "Published course not found",
    });

    await expect(enrollInCourse(7)).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
    });
  });

  it("re-throws unexpected repository errors", async () => {
    const unexpected = new Error("boom");
    vi.mocked(enrollUserInCourse).mockRejectedValueOnce(unexpected);

    await expect(enrollInCourse(7)).rejects.toBe(unexpected);
  });
});
