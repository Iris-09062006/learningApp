import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchLessonDetail, startLessonProgress } from "../lesson-repository";

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();
const mockOrder = vi.fn();
const mockRpc = vi.fn();

const mockQueryBuilder = {
  select: mockSelect,
  eq: mockEq,
  maybeSingle: mockMaybeSingle,
  order: mockOrder,
};

mockSelect.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockOrder.mockReturnValue(mockQueryBuilder);

const mockGetUser = vi.fn();

vi.mock("@/lib/supabase/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/supabase/server")>();
  return {
    ...actual,
    createServerSupabaseClient: vi.fn(() =>
      Promise.resolve({
        auth: { getUser: mockGetUser },
        from: vi.fn(() => mockQueryBuilder),
        rpc: mockRpc,
      })
    ),
  };
});

describe("lesson repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchLessonDetail", () => {
    it("returns empty result if lesson does not exist", async () => {
      mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const result = await fetchLessonDetail(1);
      expect(result).toEqual({
        lessonExists: false,
        isPublished: false,
        isAuthenticated: false,
        isEnrolled: false,
        lesson: null,
      });
    });

    it("returns unauthenticated if user is not signed in", async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: { id: 1, is_published: true, chapters: { course_id: 10 } },
        error: null,
      });
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const result = await fetchLessonDetail(1);
      expect(result).toEqual({
        lessonExists: true,
        isPublished: true,
        isAuthenticated: false,
        isEnrolled: false,
        lesson: null,
      });
    });

    it("returns un-enrolled if user has no course enrollment", async () => {
      mockMaybeSingle
        .mockResolvedValueOnce({
          data: { id: 1, is_published: true, chapters: { course_id: 10 } },
          error: null,
        })
        .mockResolvedValueOnce({ data: null, error: null }); // course_enrollments

      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } });

      const result = await fetchLessonDetail(1);
      expect(result.isAuthenticated).toBe(true);
      expect(result.isEnrolled).toBe(false);
      expect(result.lesson).toBeNull();
    });

    it("returns full lesson detail if enrolled", async () => {
      mockMaybeSingle
        .mockResolvedValueOnce({ // lesson
          data: {
            id: 1,
            chapter_id: 2,
            title: "Lesson 1",
            content: "Content 1",
            lesson_order: 1,
            estimated_minutes: 10,
            is_published: true,
            chapters: { course_id: 10 },
          },
          error: null,
        })
        .mockResolvedValueOnce({ data: { id: 5 }, error: null }) // course_enrollments
        .mockResolvedValueOnce({ data: { status: "unlocked" }, error: null }); // user_progress

      mockOrder
        .mockResolvedValueOnce({ // exercises
          data: [
            {
              id: 100,
              title: "Exercise 1",
              exercise_type: "quiz",
              difficulty: "easy",
              exercise_order: 1,
              is_published: true,
            }
          ],
          error: null,
        })
        .mockResolvedValueOnce({ // ordered published course lessons
          data: [
            { id: 1, title: "Lesson 1", lesson_order: 1, chapters: { chapter_order: 1 } },
            { id: 2, title: "Lesson 2", lesson_order: 2, chapters: { chapter_order: 1 } },
          ],
          error: null,
        });

      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "user-1" } } });

      const result = await fetchLessonDetail(1);
      expect(result.lessonExists).toBe(true);
      expect(result.isAuthenticated).toBe(true);
      expect(result.isEnrolled).toBe(true);
      expect(result.lesson).toMatchObject({
        id: 1,
        title: "Lesson 1",
        status: "unlocked",
        courseId: 10,
        exercises: [
          { id: 100, type: "quiz", difficulty: "easy" }
        ],
        nextLesson: { id: 2, title: "Lesson 2" },
      });
    });
  });

  describe("startLessonProgress", () => {
    it("throws UNAUTHENTICATED if not signed in", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });
      await expect(startLessonProgress(1)).rejects.toThrow("UNAUTHENTICATED");
    });

    it("calls start_lesson and maps unlocked progress to the API contract", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "u-1" } } });
      mockRpc.mockResolvedValueOnce({
        data: {
          lesson_id: 1,
          status: "in_progress",
          started_at: "2026-08-01T00:00:00Z",
        },
        error: null,
      });

      await expect(startLessonProgress(1)).resolves.toEqual({
        lessonId: 1,
        status: "inProgress",
        startedAt: "2026-08-01T00:00:00Z",
      });
      expect(mockRpc).toHaveBeenCalledWith("start_lesson", { p_lesson_id: 1 });
    });

    it("preserves completed progress returned by an idempotent repeat start", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "u-1" } } });
      mockRpc.mockResolvedValueOnce({
        data: {
          lesson_id: 1,
          status: "completed",
          started_at: "2026-08-01T00:00:00Z",
        },
        error: null,
      });

      const result = await startLessonProgress(1);
      expect(result).toEqual({
        lessonId: 1,
        status: "completed",
        startedAt: "2026-08-01T00:00:00Z",
      });
    });

    it.each([
      ["Authentication required", "UNAUTHENTICATED"],
      ["Published lesson not found", "LESSON_NOT_FOUND"],
      ["Active learner profile required", "ACTIVE_LEARNER_REQUIRED"],
      ["Course enrollment required", "COURSE_NOT_ENROLLED"],
      ["Lesson access required", "LESSON_LOCKED"],
      ["Lesson is locked", "LESSON_LOCKED"],
    ])("maps the RPC error %s to %s", async (rpcMessage, expectedMessage) => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "u-1" } } });
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: rpcMessage },
      });

      await expect(startLessonProgress(1)).rejects.toThrow(expectedMessage);
    });

    it("preserves unexpected RPC error details", async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: { id: "u-1" } } });
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "database unavailable" },
      });

      await expect(startLessonProgress(1)).rejects.toThrow(
        "Failed to start lesson: database unavailable",
      );
    });
  });
});
