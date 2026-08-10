import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContentPipelineAdmin, requestPipelineApi } from "../content-pipeline-admin";

const lesson = {
  id: 71,
  sourceDocumentId: 9,
  courseId: 31,
  chapterId: 41,
  targetLessonId: 51,
  title: "Biến Python",
  summary: "Kiến thức nền tảng về biến.",
  estimatedMinutes: 12,
  sections: [{ heading: "Khái niệm", bodyMarkdown: "Nội dung", citationChunkIndexes: [0] }],
  status: "pending_review",
  revision: 1,
  approvedRevision: null,
  provider: "9router",
  model: "model",
  publishedAt: null,
  createdAt: "2026-08-10T00:00:00Z",
  updatedAt: "2026-08-10T00:00:00Z",
};

function batchItems() {
  return [{
    sourceDocumentId: 9,
    sourceFilename: "python.pdf",
    courseId: 31,
    courseTitle: "Python nền tảng",
    courseDescription: "Khóa học nhập môn.",
    status: "pending_review",
    createdAt: "2026-08-10T00:00:00Z",
    lessons: [lesson, { ...lesson, id: 72, targetLessonId: 52, title: "Hàm Python" }],
  }];
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

describe("content pipeline Admin", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("does not expose JSON parser errors for an HTML gateway timeout", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("<html>timeout</html>", { status: 504 }));
    await expect(requestPipelineApi("/api/admin/course-drafts")).rejects.toThrow(
      "Dịch vụ tạm thời quá tải hoặc hết thời gian chờ. Vui lòng thử lại."
    );
  });

  it("renders Course metadata and its ordered Lesson review list", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/admin/course-drafts") return json({ success: true, data: { items: batchItems() } });
      if (url === "/api/admin/content-targets") return json({ success: true, data: { items: [] } });
      if (url === "/api/admin/lesson-drafts/71") return json({ success: true, data: lesson });
      throw new Error(`Unexpected request: ${url}`);
    });
    render(<ContentPipelineAdmin />);
    expect((await screen.findAllByText("Python nền tảng")).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Khóa học nhập môn.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /2\. Hàm Python/u })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /1\. Biến Python/u }));
    expect(await screen.findByDisplayValue("Nội dung")).toBeInTheDocument();
  });

  it("uploads, extracts, and generates a Course batch without creating curriculum or exercises first", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    let generated = false;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      calls.push({ url, init });
      if (url === "/api/admin/course-drafts") return json({ success: true, data: { items: generated ? batchItems() : [] } });
      if (url === "/api/admin/content-targets") return json({ success: true, data: { items: [] } });
      if (url === "/api/admin/content-sources") return json({ success: true, data: { id: 9, originalFilename: "python.pdf" } }, 201);
      if (url === "/api/admin/content-sources/9/extract") return json({ success: true, data: {} });
      if (url === "/api/admin/content-sources/9/generate") {
        generated = true;
        return json({ success: true, data: { sourceDocumentId: 9, courseId: 31, lessonDraftIds: [71] } }, 201);
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    render(<ContentPipelineAdmin />);
    await screen.findByText("Không có Course draft đang chờ duyệt.");
    fireEvent.change(screen.getByLabelText("Tài liệu nguồn"), {
      target: { files: [new File(["pdf"], "python.pdf", { type: "application/pdf" })] },
    });
    fireEvent.submit(screen.getByRole("button", { name: "Tạo Course draft" }).closest("form") as HTMLFormElement);
    expect(await screen.findByText("Course draft đã được lưu và đưa vào hàng chờ duyệt.")).toBeInTheDocument();
    const generateCall = calls.find((call) => call.url.endsWith("/generate"));
    expect(generateCall?.init?.body).toBe("{}");
    expect(calls.some((call) => call.url.includes("content-curriculum"))).toBe(false);
    expect(calls.some((call) => call.url.includes("/api/ai/exercises"))).toBe(false);
  });

  it("removes an approved batch from the pending queue and keeps the publish result", async () => {
    let resolved = false;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/admin/course-drafts") return json({ success: true, data: { items: resolved ? [] : batchItems() } });
      if (url === "/api/admin/content-targets") return json({ success: true, data: { items: [] } });
      if (url === "/api/admin/course-drafts/9/reviews") {
        resolved = true;
        return json({ success: true, data: { sourceDocumentId: 9, courseId: 31, status: "published", lessonIds: [51] } }, 201);
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    render(<ContentPipelineAdmin />);
    fireEvent.click(await screen.findByRole("button", { name: "Duyệt & xuất bản Course" }));
    expect(await screen.findByText("Hàng chờ trống.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mở Course" })).toHaveAttribute("href", "/courses/31");
  });

  it("generates an exercise for exactly the selected published Lesson", async () => {
    let exerciseBody: Record<string, unknown> | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "/api/admin/course-drafts") return json({ success: true, data: { items: [] } });
      if (url === "/api/admin/content-targets") return json({ success: true, data: { items: [{
        courseId: 31, courseTitle: "Python", chapterId: 41, chapterTitle: "Chính",
        lessonId: 51, lessonTitle: "Biến", isPublished: true,
      }] } });
      if (url === "/api/ai/exercises/generate") {
        exerciseBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return json({ generatedExercise: { id: 88, lessonId: 51, title: "Dự đoán", status: "pending" } }, 201);
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    render(<ContentPipelineAdmin />);
    await screen.findByRole("option", { name: "Python · Biến" });
    fireEvent.change(screen.getByLabelText("Lesson"), { target: { value: "51" } });
    fireEvent.change(screen.getByLabelText("Mục tiêu học tập"), { target: { value: "Hiểu phép gán" } });
    fireEvent.click(screen.getByRole("button", { name: "Sinh bài tập cho Lesson này" }));
    expect(await screen.findByText(/Lesson #51/u)).toBeInTheDocument();
    expect(exerciseBody).toMatchObject({ lessonId: 51, learningObjective: "Hiểu phép gán" });
  });

  it("restores a failed generation checkpoint for retry", async () => {
    sessionStorage.setItem("learningapp.course-draft-generation", JSON.stringify({
      sourceDocumentId: 9,
      sourceFilename: "python.pdf",
    }));
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/admin/course-drafts") return json({ success: true, data: { items: [] } });
      if (url === "/api/admin/content-targets") return json({ success: true, data: { items: [] } });
      if (url === "/api/admin/content-sources/9/generate") return json({ success: true, data: {} }, 201);
      throw new Error(`Unexpected request: ${url}`);
    });
    render(<ContentPipelineAdmin />);
    expect(await screen.findByRole("button", { name: "Thử sinh lại" })).toBeInTheDocument();
  });
});
