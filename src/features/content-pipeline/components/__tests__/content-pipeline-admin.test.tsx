import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContentPipelineAdmin, requestPipelineApi } from "../content-pipeline-admin";

describe("content pipeline API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("does not expose JSON parser errors for an HTML gateway timeout", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response("<!DOCTYPE html><title>timeout</title>", { status: 504 }));

    await expect(requestPipelineApi("/api/admin/content-targets")).rejects.toThrow(
      "Dịch vụ tạm thời quá tải hoặc hết thời gian chờ. Vui lòng thử lại.",
    );
    await expect(requestPipelineApi("/api/admin/content-targets")).rejects.not.toThrow(
      "Unexpected token",
    );
  });

  it("settles the initial loading message after a malformed response", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response("<!DOCTYPE html><title>timeout</title>", { status: 504 }));

    render(<ContentPipelineAdmin />);

    expect(screen.getByText("Đang tải dữ liệu...")).toBeInTheDocument();
    await screen.findByRole("alert");
    await waitFor(() => expect(screen.queryByText("Đang tải dữ liệu...")).not.toBeInTheDocument());
  });

  it("returns data from the standard JSON envelope", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: { lessonId: 12 } }), { status: 201 }),
    );

    await expect(requestPipelineApi<{ lessonId: number }>("/api/admin/content-targets"))
      .resolves.toEqual({ lessonId: 12 });
  });

  it("keeps new-course creation separate from an existing lesson target", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/admin/content-targets") {
        return new Response(JSON.stringify({
          success: true,
          data: {
            items: [{
              courseId: 31,
              courseTitle: "Phương pháp tính",
              chapterId: 41,
              chapterTitle: "Nội suy",
              lessonId: 51,
              lessonTitle: "Lagrange",
            }],
            chapters: [{ courseId: 31, courseTitle: "Phương pháp tính", chapterId: 41, chapterTitle: "Nội suy" }],
            courses: [{ courseId: 31, courseTitle: "Phương pháp tính" }],
          },
        }));
      }
      if (url === "/api/admin/lesson-drafts") {
        return new Response(JSON.stringify({ success: true, data: { items: [] } }));
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    render(<ContentPipelineAdmin />);

    expect(await screen.findByLabelText("Tên course mới")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tạo course/chapter" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Course / chapter")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload & tạo draft" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Tài liệu nguồn"), {
      target: { files: [new File(["pdf"], "week 5. Noi suy Spline.pdf", { type: "application/pdf" })] },
    });
    fireEvent.change(screen.getByLabelText("Tên course mới"), { target: { value: "Toán ứng dụng" } });

    expect(screen.getByText("week 5. Noi suy Spline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload & tạo draft" })).toBeEnabled();

    fireEvent.click(screen.getByLabelText("Thêm vào course hiện có"));

    expect(screen.queryByLabelText("Tên course mới")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Bài học hiện có")).toHaveValue("51");
    expect(screen.getByRole("option", { name: "Phương pháp tính / Nội suy / Lagrange" })).toBeInTheDocument();
    expect(screen.getByText(/không tạo thêm course, chapter hay lesson/u)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload & tạo draft" })).toBeEnabled();
  });

  it("uses an existing lesson directly and never calls the curriculum creation route", async () => {
    const calls: string[] = [];
    const draft = {
      id: 71,
      sourceDocumentId: 9,
      courseId: 31,
      chapterId: 41,
      targetLessonId: 51,
      title: "Lagrange",
      summary: "Tóm tắt",
      estimatedMinutes: 12,
      sections: [{ heading: "Mở đầu", bodyMarkdown: "Nội dung", citationChunkIndexes: [0] }],
      status: "pending_review" as const,
      revision: 1,
      approvedRevision: null,
      provider: "9router",
      model: "model",
      publishedAt: null,
      createdAt: "2026-08-10T00:00:00Z",
      updatedAt: "2026-08-10T00:00:00Z",
    };
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      calls.push(url);
      if (url === "/api/admin/content-targets") return new Response(JSON.stringify({ success: true, data: { items: [{ courseId: 31, courseTitle: "Phương pháp tính", chapterId: 41, chapterTitle: "Nội suy", lessonId: 51, lessonTitle: "Lagrange" }] } }));
      if (url === "/api/admin/lesson-drafts") return new Response(JSON.stringify({ success: true, data: { items: calls.includes("/api/admin/content-sources/9/generate") ? [draft] : [] } }));
      if (url === "/api/admin/content-sources") return new Response(JSON.stringify({ success: true, data: { id: 9 } }), { status: 201 });
      if (url === "/api/admin/content-sources/9/extract") return new Response(JSON.stringify({ success: true, data: {} }));
      if (url === "/api/admin/content-sources/9/generate") return new Response(JSON.stringify({ success: true, data: { lessonDraftId: 71 } }));
      if (url === "/api/admin/lesson-drafts/71") return new Response(JSON.stringify({ success: true, data: draft }));
      throw new Error(`Unexpected request: ${url}`);
    });

    render(<ContentPipelineAdmin />);
    await screen.findByLabelText("Tên course mới");
    fireEvent.click(screen.getByLabelText("Thêm vào course hiện có"));
    await waitFor(() => expect(screen.getByLabelText("Bài học hiện có")).toHaveValue("51"));
    fireEvent.change(screen.getByLabelText("Tài liệu nguồn"), {
      target: { files: [new File(["source"], "lagrange.txt", { type: "text/plain" })] },
    });
    const submit = screen.getByRole("button", { name: "Upload & tạo draft" });
    await waitFor(() => expect(submit).toBeEnabled());
    const form = submit.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    expect(await screen.findByDisplayValue("Lagrange")).toBeInTheDocument();
    expect(calls).toContain("/api/admin/content-sources/9/generate");
    expect(calls).not.toContain("/api/admin/content-curriculum");
  });

  it("restores a failed generation checkpoint and publishes through the transaction button", async () => {
    sessionStorage.setItem("learningapp:pending-lesson-draft-generation", JSON.stringify({
      sourceDocumentId: 9,
      targetLessonId: 51,
    }));
    let status: "approved" | "published" = "approved";
    const createDraft = () => ({
      id: 71,
      sourceDocumentId: 9,
      courseId: 31,
      chapterId: 41,
      targetLessonId: 51,
      title: "Lagrange",
      summary: "Tóm tắt",
      estimatedMinutes: 12,
      sections: [{ heading: "Mở đầu", bodyMarkdown: "Nội dung", citationChunkIndexes: [0] }],
      status,
      revision: 1,
      approvedRevision: 1,
      provider: "9router",
      model: "model",
      publishedAt: status === "published" ? "2026-08-10T01:00:00Z" : null,
      createdAt: "2026-08-10T00:00:00Z",
      updatedAt: "2026-08-10T00:00:00Z",
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/admin/content-targets") return new Response(JSON.stringify({ success: true, data: { items: [] } }));
      if (url === "/api/admin/lesson-drafts") return new Response(JSON.stringify({ success: true, data: { items: status === "approved" ? [] : [createDraft()] } }));
      if (url === "/api/admin/content-sources/9/generate") return new Response(JSON.stringify({ success: true, data: { lessonDraftId: 71 } }));
      if (url === "/api/admin/lesson-drafts/71") return new Response(JSON.stringify({ success: true, data: createDraft() }));
      if (url === "/api/admin/lesson-drafts/71/publish") {
        status = "published";
        return new Response(JSON.stringify({ success: true, data: { lessonDraftId: 71, lessonId: 51, courseId: 31, status: "published", coursePublished: true, publishedAt: "2026-08-10T01:00:00Z" } }));
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    render(<ContentPipelineAdmin />);
    fireEvent.click(await screen.findByRole("button", { name: "Thử tạo lại draft" }));
    expect(await screen.findByRole("button", { name: "Xuất bản bài học (transaction)" })).toBeEnabled();
    expect(sessionStorage.getItem("learningapp:pending-lesson-draft-generation")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Xuất bản bài học (transaction)" }));
    expect(await screen.findByRole("link", { name: "Mở khóa học" })).toHaveAttribute("href", "/courses/31");
    expect(screen.getByRole("link", { name: "Mở lộ trình" })).toHaveAttribute("href", "/courses/31/roadmap");
    expect(screen.getByRole("link", { name: "Mở bài học" })).toHaveAttribute("href", "/lessons/51");
  });

  it("clears a stale retry checkpoint when the matching draft already exists", async () => {
    sessionStorage.setItem("learningapp:pending-lesson-draft-generation", JSON.stringify({
      sourceDocumentId: 9,
      targetLessonId: 51,
    }));
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/admin/content-targets") return new Response(JSON.stringify({ success: true, data: { items: [] } }));
      if (url === "/api/admin/lesson-drafts") return new Response(JSON.stringify({ success: true, data: { items: [{
        id: 71,
        sourceDocumentId: 9,
        courseId: 31,
        chapterId: 41,
        targetLessonId: 51,
        title: "Lagrange",
        summary: "Tóm tắt",
        estimatedMinutes: 12,
        sections: [],
        status: "pending_review",
        revision: 1,
        approvedRevision: null,
        provider: "9router",
        model: "model",
        publishedAt: null,
        createdAt: "2026-08-10T00:00:00Z",
        updatedAt: "2026-08-10T00:00:00Z",
      }] } }));
      throw new Error(`Unexpected request: ${url}`);
    });

    render(<ContentPipelineAdmin />);

    await screen.findByRole("button", { name: /Lagrange/u });
    await waitFor(() => expect(sessionStorage.getItem("learningapp:pending-lesson-draft-generation")).toBeNull());
    expect(screen.queryByRole("button", { name: "Thử tạo lại draft" })).not.toBeInTheDocument();
  });
});
