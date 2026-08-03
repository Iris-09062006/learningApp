import { describe, expect, it, vi } from "vitest";

import { enrollUserInCourse } from "../course-repository";
import type { EnrollCourseRpcRaw } from "@/features/courses/types";

const mockRpc = vi.fn();

vi.mock("@/lib/supabase/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/server")>();
  return {
    ...actual,
    createServerSupabaseClient: vi.fn(() =>
      Promise.resolve({
        rpc: mockRpc,
        auth: { getUser: vi.fn() },
        from: vi.fn(),
      })
    ),
  };
});

describe("enrollUserInCourse", () => {
  it("calls rpc enroll_course with courseId and maps raw result", async () => {
    const raw: EnrollCourseRpcRaw = {
      enrollment_id: 5,
      course_id: 1,
      enrolled_at: "2026-08-03T10:00:00Z",
      first_lesson_id: 7,
    };
    mockRpc.mockResolvedValueOnce({ data: raw, error: null });

    const result = await enrollUserInCourse(1);

    expect(mockRpc).toHaveBeenCalledWith("enroll_course", {
      p_course_id: 1,
    });
    expect(result).toEqual({
      enrollmentId: 5,
      courseId: 1,
      enrolledAt: raw.enrolled_at,
      firstLessonId: 7,
    });
  });

  it("returns null firstLessonId when absent", async () => {
    const raw: EnrollCourseRpcRaw = {
      enrollment_id: 6,
      course_id: 2,
      enrolled_at: "2026-08-03T10:00:00Z",
      first_lesson_id: null,
    };
    mockRpc.mockResolvedValueOnce({ data: raw, error: null });

    const result = await enrollUserInCourse(2);

    expect(result.firstLessonId).toBeNull();
  });

  it("throws when supabase rpc returns an error", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: new Error("permission denied"),
    });

    await expect(enrollUserInCourse(9)).rejects.toThrow("permission denied");
    expect(mockRpc).toHaveBeenCalledWith("enroll_course", {
      p_course_id: 9,
    });
  });
});