import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminSupabaseClient: vi.fn(),
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: mocks.createAdminSupabaseClient,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import {
  getGenerationContext,
  listContentChapters,
  listContentCourses,
  listContentTargets,
  listCourseDraftBatches,
} from "./content-pipeline-repository";

function maybeSingleQuery(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

function orderedQuery(data: unknown[]) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error: null }),
  };
}

describe("getGenerationContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads unpublished generation targets through the server-only Admin client", async () => {
    const document = { id: 5, status: "extracted" };
    const chunks = [{ id: 9, chunk_index: 0, content: "Nội dung" }];
    const lesson = {
      id: 1,
      title: "Nội suy Lagrange",
      chapter_id: 2,
      chapters: { id: 2, course_id: 2 },
    };
    const queries = new Map<string, ReturnType<typeof maybeSingleQuery> | ReturnType<typeof orderedQuery>>([
      ["source_documents", maybeSingleQuery(document)],
      ["document_chunks", orderedQuery(chunks)],
      ["lessons", maybeSingleQuery(lesson)],
    ]);
    mocks.createAdminSupabaseClient.mockReturnValue({
      from: vi.fn((table: string) => queries.get(table)),
    });

    await expect(getGenerationContext(5, 1)).resolves.toEqual({ document, chunks, lesson });
    expect(mocks.createAdminSupabaseClient).toHaveBeenCalledOnce();
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("lists unpublished curriculum through the server-only Admin client", async () => {
    const queries = new Map<string, ReturnType<typeof orderedQuery>>([
      [
        "lessons",
        orderedQuery([
          {
            id: 1,
            title: "Draft lesson",
            chapter_id: 2,
            chapters: {
              id: 2,
              title: "Draft chapter",
              course_id: 2,
              courses: { id: 2, title: "Draft course" },
            },
          },
        ]),
      ],
      [
        "chapters",
        orderedQuery([
          {
            id: 2,
            title: "Draft chapter",
            course_id: 2,
            courses: { id: 2, title: "Draft course" },
          },
        ]),
      ],
      ["courses", orderedQuery([{ id: 2, title: "Draft course" }])],
    ]);
    mocks.createAdminSupabaseClient.mockReturnValue({
      from: vi.fn((table: string) => queries.get(table)),
    });

    await expect(listContentTargets()).resolves.toEqual([
      {
        lessonId: 1,
        lessonTitle: "Draft lesson",
        chapterId: 2,
        chapterTitle: "Draft chapter",
        courseId: 2,
        courseTitle: "Draft course",
      },
    ]);
    await expect(listContentChapters()).resolves.toEqual([
      {
        chapterId: 2,
        chapterTitle: "Draft chapter",
        courseId: 2,
        courseTitle: "Draft course",
      },
    ]);
    await expect(listContentCourses()).resolves.toEqual([
      { courseId: 2, courseTitle: "Draft course" },
    ]);
    expect(mocks.createAdminSupabaseClient).toHaveBeenCalledTimes(3);
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("groups unresolved Lesson drafts into one Course batch per source document", async () => {
    const rows = [1, 2].map((id) => ({
      id: 70 + id,
      source_document_id: 9,
      course_id: 31,
      chapter_id: 41,
      target_lesson_id: 50 + id,
      title: id === 1 ? "Biến" : "Hàm",
      summary: "Tóm tắt",
      estimated_minutes: 10,
      sections: [],
      status: "pending_review",
      revision: 1,
      approved_revision: null,
      provider: "9router",
      model: "model",
      published_at: null,
      created_at: "2026-08-10T00:00:00Z",
      updated_at: "2026-08-10T00:00:00Z",
      source_documents: { original_filename: "python.pdf", status: "ready_for_review" },
      courses: { title: "Python", description: "Khóa học" },
    }));
    const query = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
    };
    mocks.createAdminSupabaseClient.mockReturnValue({ from: vi.fn().mockReturnValue(query) });

    await expect(listCourseDraftBatches()).resolves.toMatchObject([{
      sourceDocumentId: 9,
      courseId: 31,
      courseTitle: "Python",
      lessons: [{ id: 71 }, { id: 72 }],
    }]);
  });
});
