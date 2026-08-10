import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ContentPipelineAdmin, requestPipelineApi } from "../content-pipeline-admin";

describe("content pipeline API client", () => {
  afterEach(() => vi.restoreAllMocks());

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

  it("keeps new-course and existing-course destinations separate", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url === "/api/admin/content-targets") {
        return new Response(JSON.stringify({
          success: true,
          data: {
            items: [],
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
    expect(screen.getByLabelText("Course hiện có")).toHaveValue("31");
    expect(screen.getByRole("option", { name: "Phương pháp tính" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload & tạo draft" })).toBeEnabled();
  });
});
