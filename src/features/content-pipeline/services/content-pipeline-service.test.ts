import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createContentTarget: vi.fn(),
  createContentCurriculum: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  getGenerationContext: vi.fn(),
  getSourceDocument: vi.fn(),
  listContentChapters: vi.fn(),
  listContentCourses: vi.fn(),
  listContentTargets: vi.fn(),
  persistGeneratedDraft: vi.fn(),
  updateSourceStatus: vi.fn(),
}));

vi.mock("@/features/content-pipeline/repositories/content-pipeline-repository", () => ({
  createContentTarget: mocks.createContentTarget,
  createContentCurriculum: mocks.createContentCurriculum,
  getGenerationContext: mocks.getGenerationContext,
  getSourceDocument: mocks.getSourceDocument,
  listContentChapters: mocks.listContentChapters,
  listContentCourses: mocks.listContentCourses,
  listContentTargets: mocks.listContentTargets,
  persistGeneratedDraft: mocks.persistGeneratedDraft,
  updateSourceStatus: mocks.updateSourceStatus,
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
  generateLessonDraft,
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

  it("rejects existing mode because it must target an existing lesson without curriculum writes", async () => {
    await expect(createNewContentCurriculum({ mode: "existing", courseId: 3, sourceDocumentId: 8 }))
      .rejects.toMatchObject({ code: "VALIDATION_ERROR" } satisfies Partial<ContentPipelineError>);

    expect(mocks.getSourceDocument).not.toHaveBeenCalled();
    expect(mocks.createContentCurriculum).not.toHaveBeenCalled();
  });

  it("rejects an incomplete destination before repository access", async () => {
    mocks.getSourceDocument.mockResolvedValue({ originalFilename: "Nội suy.pdf" });
    await expect(createNewContentCurriculum({ mode: "new", courseTitle: "", sourceDocumentId: 8 }))
      .rejects.toMatchObject({ code: "VALIDATION_ERROR" } satisfies Partial<ContentPipelineError>);
    expect(mocks.createContentCurriculum).not.toHaveBeenCalled();
  });
});

describe("generateLessonDraft retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } } }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { role: "admin", is_active: true }, error: null }) }) }),
      }),
    });
    mocks.getGenerationContext.mockResolvedValue({
      document: { status: "failed", error_code: "GENERATION_FAILED", original_filename: "Lagrange.txt" },
      chunks: [{ id: 1, chunk_index: 0, content: "Nguồn" }],
      lesson: { id: 51, title: "Lagrange", chapter_id: 41, chapters: { course_id: 31 } },
    });
    mocks.persistGeneratedDraft.mockResolvedValue(71);
    mocks.updateSourceStatus.mockResolvedValue(undefined);
  });

  it("retries a source whose previous AI generation failed", async () => {
    const provider = {
      generateLessonDraft: vi.fn().mockResolvedValue({
        draft: {
          title: "Lagrange",
          summary: "Tóm tắt",
          estimatedMinutes: 12,
          sections: [{ heading: "Mở đầu", bodyMarkdown: "Nội dung", citationChunkIndexes: [0] }],
        },
        provider: "9router",
        model: "model",
      }),
    };

    await expect(generateLessonDraft(9, 51, provider)).resolves.toEqual({
      lessonDraftId: 71,
      status: "pending_review",
    });
    expect(mocks.updateSourceStatus).toHaveBeenCalledWith(9, "generating");
  });

  it("does not retry an extraction failure as generation", async () => {
    mocks.getGenerationContext.mockResolvedValueOnce({
      document: { status: "failed", error_code: "EXTRACTION_FAILED", original_filename: "Lagrange.txt" },
      chunks: [],
      lesson: { id: 51, title: "Lagrange", chapter_id: 41, chapters: { course_id: 31 } },
    });

    await expect(generateLessonDraft(9, 51, { generateLessonDraft: vi.fn() }))
      .rejects.toMatchObject({ code: "INVALID_STATE" } satisfies Partial<ContentPipelineError>);
  });
});
