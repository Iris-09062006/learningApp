import { afterEach, describe, expect, it, vi } from "vitest";

import { NineRouterLessonDraftProvider } from "./lesson-draft-provider";

describe("NineRouterLessonDraftProvider", () => {
  afterEach(() => vi.restoreAllMocks());

  it("accepts strict output with valid citations", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      model: "test-model",
      choices: [{ message: { content: JSON.stringify({
        title: "Biến Python",
        summary: "Giới thiệu biến.",
        estimatedMinutes: 10,
        sections: [{
          heading: "Khái niệm",
          bodyMarkdown: "Biến lưu dữ liệu.",
          citationChunkIndexes: [0],
        }],
      }) } }],
    }), { status: 200 }));
    const provider = new NineRouterLessonDraftProvider("secret", "https://router.test/v1/chat/completions", "test-model");
    const result = await provider.generateLessonDraft({
      documentTitle: "Nguồn",
      lessonTitle: "Biến",
      chunks: [{ chunkIndex: 0, content: "Biến lưu dữ liệu." }],
    });
    expect(result.provider).toBe("9router");
    expect(result.draft.sections[0].citationChunkIndexes).toEqual([0]);
  });

  it("rejects citations outside supplied context", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        title: "Draft",
        summary: "Summary",
        estimatedMinutes: 10,
        sections: [{ heading: "Section", bodyMarkdown: "Body", citationChunkIndexes: [99] }],
      }) } }],
    }), { status: 200 }));
    const provider = new NineRouterLessonDraftProvider("secret", "https://router.test/v1/chat/completions", "test-model");
    await expect(provider.generateLessonDraft({
      documentTitle: "Nguồn",
      lessonTitle: "Bài",
      chunks: [{ chunkIndex: 0, content: "Nguồn hợp lệ" }],
    })).rejects.toThrow("AI_RESPONSE_INVALID");
  });

  it("maps an HTML provider response to a stable provider error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<!DOCTYPE html><title>Gateway timeout</title>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
    );
    const provider = new NineRouterLessonDraftProvider(
      "secret",
      "https://router.test/v1/chat/completions",
      "test-model",
    );

    await expect(provider.generateLessonDraft({
      documentTitle: "Nguồn",
      lessonTitle: "Bài",
      chunks: [{ chunkIndex: 0, content: "Nguồn hợp lệ" }],
    })).rejects.toThrow("AI_PROVIDER_RESPONSE_INVALID");
  });

  it("generates a Course with ordered cited Lessons and explicitly excludes exercises", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      model: "test-model",
      choices: [{ message: { content: JSON.stringify({
        title: "Python nền tảng",
        description: "Khóa học nhập môn",
        lessons: [
          { title: "Biến", summary: "Tóm tắt", estimatedMinutes: 10, sections: [{ heading: "Khái niệm", bodyMarkdown: "Nội dung", citationChunkIndexes: [0] }] },
          { title: "Kiểu dữ liệu", summary: "Tóm tắt", estimatedMinutes: 12, sections: [{ heading: "Phân loại", bodyMarkdown: "Nội dung", citationChunkIndexes: [1] }] },
        ],
      }) } }],
    }), { status: 200 }));
    const provider = new NineRouterLessonDraftProvider("secret", "https://router.test/v1/chat/completions", "test-model");

    const result = await provider.generateCourseDraft({
      documentTitle: "python.pdf",
      chunks: [{ chunkIndex: 0, content: "Biến" }, { chunkIndex: 1, content: "Kiểu dữ liệu" }],
    });

    expect(result.draft.lessons).toHaveLength(2);
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as { messages: Array<{ content: string }> };
    expect(request.messages[0].content).toContain("Do not create");
    expect(request.messages[0].content).toContain("exercises");
  });

  it("rejects a Course response that contains an exercise field", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        title: "Python",
        description: "Khóa học",
        exercises: [{ title: "Không được phép" }],
        lessons: [
          { title: "Biến", summary: "Tóm tắt", estimatedMinutes: 10, sections: [{ heading: "A", bodyMarkdown: "A", citationChunkIndexes: [0] }] },
          { title: "Hàm", summary: "Tóm tắt", estimatedMinutes: 10, sections: [{ heading: "B", bodyMarkdown: "B", citationChunkIndexes: [0] }] },
        ],
      }) } }],
    }), { status: 200 }));
    const provider = new NineRouterLessonDraftProvider("secret", "https://router.test", "model");
    await expect(provider.generateCourseDraft({
      documentTitle: "python.pdf",
      chunks: [{ chunkIndex: 0, content: "Nguồn" }],
    })).rejects.toThrow("AI_RESPONSE_INVALID");
  });
});
