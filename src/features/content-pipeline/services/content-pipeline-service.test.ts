import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createContentTarget: vi.fn(),
  createContentCurriculum: vi.fn(),
  createContentTargetInCourse: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  getSourceDocument: vi.fn(),
  listContentChapters: vi.fn(),
  listContentCourses: vi.fn(),
  listContentTargets: vi.fn(),
}));

vi.mock("@/features/content-pipeline/repositories/content-pipeline-repository", () => ({
  createContentTarget: mocks.createContentTarget,
  createContentCurriculum: mocks.createContentCurriculum,
  createContentTargetInCourse: mocks.createContentTargetInCourse,
  getSourceDocument: mocks.getSourceDocument,
  listContentChapters: mocks.listContentChapters,
  listContentCourses: mocks.listContentCourses,
  listContentTargets: mocks.listContentTargets,
}));

vi.mock("@/features/content-pipeline/extraction/document-extractor", () => {
  throw new Error("Document extractor must be loaded lazily.");
});

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import {
  ContentPipelineError,
  createNewContentCurriculum,
  createNewContentTarget,
  getContentTargets,
} from "./content-pipeline-service";

describe("createNewContentTarget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: "admin", is_active: true } }),
          }),
        }),
      }),
    });
  });

  it("validates and trims the new lesson target", async () => {
    mocks.createContentTarget.mockResolvedValue({ lessonId: 9 });

    await createNewContentTarget({ chapterId: 2, title: "  Bài mới  " });

    expect(mocks.createContentTarget).toHaveBeenCalledWith({ chapterId: 2, title: "Bài mới" });
  });

  it("maps a missing chapter to the public not-found contract", async () => {
    mocks.createContentTarget.mockRejectedValue(new Error("CHAPTER_NOT_FOUND"));

    await expect(createNewContentTarget({ chapterId: 999, title: "Bài mới" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" } satisfies Partial<ContentPipelineError>);
  });

  it("rejects blank lesson titles before repository access", async () => {
    await expect(createNewContentTarget({ chapterId: 2, title: "   " }))
      .rejects.toMatchObject({ code: "VALIDATION_ERROR" } satisfies Partial<ContentPipelineError>);
    expect(mocks.createContentTarget).not.toHaveBeenCalled();
  });

  it("lists content targets without loading the document parser", async () => {
    mocks.listContentTargets.mockResolvedValue([]);
    mocks.listContentChapters.mockResolvedValue([]);
    mocks.listContentCourses.mockResolvedValue([]);

    await expect(getContentTargets()).resolves.toEqual({ items: [], chapters: [], courses: [] });
  });

  it("creates a new course target using the source filename as chapter title", async () => {
    mocks.getSourceDocument.mockResolvedValue({ originalFilename: "Nội suy Spline.pdf" });
    mocks.createContentCurriculum.mockResolvedValue({ courseId: 3, chapterId: 4, lessonId: 5 });

    await createNewContentCurriculum({ mode: "new", courseTitle: "  Đại số tuyến tính  ", sourceDocumentId: 8 });

    expect(mocks.createContentCurriculum).toHaveBeenCalledWith({
      courseTitle: "Đại số tuyến tính",
      courseSlug: expect.stringMatching(/^ai-so-tuyen-tinh-[a-f0-9]{8}$/),
      chapterTitle: "Nội suy Spline",
    });
  });

  it("adds a source-derived chapter target to an existing course", async () => {
    mocks.getSourceDocument.mockResolvedValue({ originalFilename: "Tuần 5.md" });
    mocks.createContentTargetInCourse.mockResolvedValue({ courseId: 3, chapterId: 4, lessonId: 5 });

    await createNewContentCurriculum({ mode: "existing", courseId: 3, sourceDocumentId: 8 });

    expect(mocks.createContentTargetInCourse).toHaveBeenCalledWith({
      courseId: 3,
      chapterTitle: "Tuần 5",
    });
    expect(mocks.createContentCurriculum).not.toHaveBeenCalled();
  });

  it("rejects an incomplete destination before repository access", async () => {
    mocks.getSourceDocument.mockResolvedValue({ originalFilename: "Nội suy.pdf" });
    await expect(createNewContentCurriculum({ mode: "new", courseTitle: "", sourceDocumentId: 8 }))
      .rejects.toMatchObject({ code: "VALIDATION_ERROR" } satisfies Partial<ContentPipelineError>);
    expect(mocks.createContentCurriculum).not.toHaveBeenCalled();
  });
});
