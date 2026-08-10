import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createContentTarget: vi.fn(),
  createContentCurriculum: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  getGenerationContext: vi.fn(),
  getCourseGenerationContext: vi.fn(),
  getSourceDocument: vi.fn(),
  listContentChapters: vi.fn(),
  listContentCourses: vi.fn(),
  listContentTargets: vi.fn(),
  persistGeneratedDraft: vi.fn(),
  persistGeneratedCourseDraft: vi.fn(),
  listCourseDraftBatches: vi.fn(),
  listCourseImports: vi.fn(),
  getCourseImport: vi.fn(),
  getCourseImportChunks: vi.fn(),
  persistCourseOutline: vi.fn(),
  prepareCourseLessonGeneration: vi.fn(),
  persistCourseLessonContent: vi.fn(),
  failCourseImport: vi.fn(),
  reviewCourseImport: vi.fn(),
  publishCourseImport: vi.fn(),
  reviseCourseLessonContent: vi.fn(),
  reviewCourseDraftBatch: vi.fn(),
  updateSourceStatus: vi.fn(),
}));

vi.mock("@/features/content-pipeline/repositories/content-pipeline-repository", () => ({
  createContentTarget: mocks.createContentTarget,
  createContentCurriculum: mocks.createContentCurriculum,
  getGenerationContext: mocks.getGenerationContext,
  getCourseGenerationContext: mocks.getCourseGenerationContext,
  getSourceDocument: mocks.getSourceDocument,
  listContentChapters: mocks.listContentChapters,
  listContentCourses: mocks.listContentCourses,
  listContentTargets: mocks.listContentTargets,
  persistGeneratedDraft: mocks.persistGeneratedDraft,
  persistGeneratedCourseDraft: mocks.persistGeneratedCourseDraft,
  listCourseDraftBatches: mocks.listCourseDraftBatches,
  listCourseImports: mocks.listCourseImports,
  getCourseImport: mocks.getCourseImport,
  getCourseImportChunks: mocks.getCourseImportChunks,
  persistCourseOutline: mocks.persistCourseOutline,
  prepareCourseLessonGeneration: mocks.prepareCourseLessonGeneration,
  persistCourseLessonContent: mocks.persistCourseLessonContent,
  failCourseImport: mocks.failCourseImport,
  reviewCourseImport: mocks.reviewCourseImport,
  publishCourseImport: mocks.publishCourseImport,
  reviseCourseLessonContent: mocks.reviseCourseLessonContent,
  reviewCourseDraftBatch: mocks.reviewCourseDraftBatch,
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
  generateCourseDraft,
  generateCourseOutline,
  generateCourseLessonContents,
  getCourseDraftQueue,
  submitCourseDraftReview,
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

describe("Course draft batches", () => {
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
    mocks.getCourseGenerationContext.mockResolvedValue({
      document: { status: "extracted", error_code: null, original_filename: "python.pdf" },
      chunks: [{ id: 1, chunk_index: 0, content: "Biến và kiểu dữ liệu" }],
    });
    mocks.updateSourceStatus.mockResolvedValue(undefined);
    mocks.persistGeneratedCourseDraft.mockResolvedValue({
      sourceDocumentId: 9,
      courseId: 31,
      chapterId: 41,
      lessonDraftIds: [71, 72],
      status: "pending_review",
    });
  });

  it("generates multiple Lesson drafts without an exercise generation contract", async () => {
    const provider = {
      generateLessonDraft: vi.fn(),
      generateCourseDraft: vi.fn().mockResolvedValue({
        draft: {
          title: "Python nền tảng",
          description: "Khóa nhập môn",
          lessons: [
            { title: "Biến", summary: "Tóm tắt", estimatedMinutes: 10, sections: [{ heading: "Khái niệm", bodyMarkdown: "Nội dung", citationChunkIndexes: [0] }] },
            { title: "Kiểu dữ liệu", summary: "Tóm tắt", estimatedMinutes: 12, sections: [{ heading: "Khái niệm", bodyMarkdown: "Nội dung", citationChunkIndexes: [0] }] },
          ],
        },
        provider: "9router",
        model: "model",
      }),
    };

    await expect(generateCourseDraft(9, provider)).resolves.toMatchObject({
      courseId: 31,
      lessonDraftIds: [71, 72],
    });
    expect(mocks.persistGeneratedCourseDraft).toHaveBeenCalledWith(expect.objectContaining({
      sourceDocumentId: 9,
      draft: expect.objectContaining({ lessons: expect.arrayContaining([expect.objectContaining({ title: "Biến" })]) }),
    }));
    expect(provider.generateLessonDraft).not.toHaveBeenCalled();
  });

  it("lists only unresolved Course batches through the repository", async () => {
    mocks.listCourseImports.mockResolvedValue([{ sourceDocumentId: 9 }]);
    await expect(getCourseDraftQueue()).resolves.toEqual([{ sourceDocumentId: 9 }]);
  });

  it("submits the batch decision with a bounded comment", async () => {
    mocks.reviewCourseDraftBatch.mockResolvedValue({ status: "rejected" });
    await submitCourseDraftReview(9, { decision: "rejected", comment: "Không phù hợp" });
    expect(mocks.reviewCourseDraftBatch).toHaveBeenCalledWith(9, "rejected", "Không phù hợp");
  });
});

describe("two-stage Course imports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { role: "admin", is_active: true }, error: null }),
        }) }),
      }),
    });
    mocks.getCourseGenerationContext.mockResolvedValue({
      document: { status: "extracted", error_code: null, original_filename: "python.pdf" },
      chunks: [{ id: 1, chunk_index: 0, content: "Biến" }, { id: 2, chunk_index: 1, content: "Hàm" }],
    });
    mocks.persistCourseOutline.mockResolvedValue({ jobId: 61, sourceDocumentId: 9, outlineRevision: 1, status: "outline_review" });
    mocks.updateSourceStatus.mockResolvedValue(undefined);
    mocks.failCourseImport.mockResolvedValue(undefined);
  });

  it("persists an outline without generating Lesson bodies", async () => {
    const provider = {
      generateLessonDraft: vi.fn(),
      generateCourseOutline: vi.fn().mockResolvedValue({
        outline: {
          title: "Python", description: "Nhập môn", learningObjectives: ["Hiểu Python"],
          lessons: [
            { clientKey: "variables", title: "Biến", summary: "Biến", learningObjectives: ["Khai báo biến"], sourceChunkIndexes: [0] },
            { clientKey: "functions", title: "Hàm", summary: "Hàm", learningObjectives: ["Định nghĩa hàm"], sourceChunkIndexes: [1] },
          ],
        }, provider: "9router", model: "model",
      }),
    };
    await expect(generateCourseOutline(9, provider)).resolves.toMatchObject({ status: "outline_review" });
    expect(mocks.persistCourseOutline).toHaveBeenCalledWith(expect.objectContaining({
      sourceDocumentId: 9,
      outline: expect.objectContaining({ lessons: expect.arrayContaining([expect.objectContaining({ clientKey: "variables" })]) }),
    }));
    expect(provider.generateLessonDraft).not.toHaveBeenCalled();
    expect(mocks.persistCourseLessonContent).not.toHaveBeenCalled();
  });

  it("generates each Lesson only after preparing the approved outline", async () => {
    mocks.getCourseImport.mockResolvedValue({
      jobId: 61, sourceDocumentId: 9, sourceFilename: "python.pdf", status: "outline_review",
      lessons: [
        { id: 71, title: "Biến", learningObjectives: ["Khai báo biến"], sourceChunkIndexes: [0], contentDraft: null },
        { id: 72, title: "Hàm", learningObjectives: ["Định nghĩa hàm"], sourceChunkIndexes: [1], contentDraft: null },
      ],
    });
    mocks.getCourseImportChunks.mockResolvedValue([
      { id: 1, chunk_index: 0, content: "Biến" }, { id: 2, chunk_index: 1, content: "Hàm" },
    ]);
    const provider = { generateLessonDraft: vi.fn().mockResolvedValue({
      draft: { title: "Lesson", summary: "Tóm tắt", estimatedMinutes: 10,
        sections: [{ heading: "Nội dung", bodyMarkdown: "Bài học", citationChunkIndexes: [0] }] },
      provider: "9router", model: "model",
    }) };
    await generateCourseLessonContents(61, provider);
    expect(mocks.prepareCourseLessonGeneration).toHaveBeenCalledWith(61);
    expect(provider.generateLessonDraft).toHaveBeenCalledTimes(2);
    expect(mocks.persistCourseLessonContent).toHaveBeenCalledTimes(2);
  });

  it("keeps an already complete content review out of the generating state", async () => {
    mocks.getCourseImport.mockResolvedValue({
      jobId: 61, sourceDocumentId: 9, sourceFilename: "python.pdf", status: "content_review",
      lessons: [{ id: 71, title: "Biến", learningObjectives: ["Khai báo biến"], sourceChunkIndexes: [0], contentDraft: { id: 81 } }],
    });

    await expect(generateCourseLessonContents(61, { generateLessonDraft: vi.fn() })).resolves.toEqual({
      jobId: 61,
      status: "content_review",
    });
    expect(mocks.prepareCourseLessonGeneration).not.toHaveBeenCalled();
  });

  it("persists a retryable failed state when one Lesson provider call fails", async () => {
    mocks.getCourseImport.mockResolvedValue({
      jobId: 61, sourceDocumentId: 9, sourceFilename: "python.pdf", status: "outline_review",
      lessons: [{ id: 71, title: "Biến", learningObjectives: ["Khai báo biến"], sourceChunkIndexes: [0], contentDraft: null }],
    });
    mocks.getCourseImportChunks.mockResolvedValue([{ id: 1, chunk_index: 0, content: "Biến" }]);
    const provider = { generateLessonDraft: vi.fn().mockRejectedValue(new Error("AI_PROVIDER_TIMEOUT")) };

    await expect(generateCourseLessonContents(61, provider)).rejects.toMatchObject({ code: "AI_PROVIDER_ERROR" });
    expect(mocks.failCourseImport).toHaveBeenCalledWith(61, "LESSON_GENERATION_FAILED");
    expect(mocks.persistCourseLessonContent).not.toHaveBeenCalled();
  });

  it("rejects outline output with an Exercise field", async () => {
    const provider = { generateLessonDraft: vi.fn(), generateCourseOutline: vi.fn().mockResolvedValue({
      outline: {
        title: "Python", description: "Nhập môn", learningObjectives: ["Hiểu Python"], exercises: [],
        lessons: [
          { clientKey: "a", title: "A", summary: "A", learningObjectives: ["A"], sourceChunkIndexes: [0] },
          { clientKey: "b", title: "B", summary: "B", learningObjectives: ["B"], sourceChunkIndexes: [1] },
        ],
      }, provider: "9router", model: "model",
    }) };
    await expect(generateCourseOutline(9, provider)).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(mocks.persistCourseOutline).not.toHaveBeenCalled();
  });
});
