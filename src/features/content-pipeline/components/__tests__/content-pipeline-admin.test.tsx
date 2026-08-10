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

  it("lets an Admin bootstrap an empty course and chapter before upload", async () => {
    let curriculumCreated = false;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url === "/api/admin/content-curriculum" && init?.method === "POST") {
        curriculumCreated = true;
        return new Response(JSON.stringify({
          success: true,
          data: { courseId: 31, courseTitle: "Toán ứng dụng", chapterId: 41, chapterTitle: "Nội suy" },
        }), { status: 201 });
      }
      if (url === "/api/admin/content-targets") {
        return new Response(JSON.stringify({
          success: true,
          data: {
            items: [],
            chapters: curriculumCreated
              ? [{ courseId: 31, courseTitle: "Toán ứng dụng", chapterId: 41, chapterTitle: "Nội suy" }]
              : [],
          },
        }));
      }
      if (url === "/api/admin/lesson-drafts") {
        return new Response(JSON.stringify({ success: true, data: { items: [] } }));
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    render(<ContentPipelineAdmin />);

    expect(await screen.findByText(/Chưa có course\/chapter nào/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload & tạo draft" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Tên course"), { target: { value: "Toán ứng dụng" } });
    fireEvent.change(screen.getByLabelText("Tên chapter đầu tiên"), { target: { value: "Nội suy" } });
    fireEvent.click(screen.getByRole("button", { name: "Tạo course/chapter" }));

    await waitFor(() => expect(screen.getByLabelText("Course / chapter")).toHaveValue("41"));
    expect(screen.getByRole("button", { name: "Upload & tạo draft" })).toBeEnabled();
    expect(screen.getByText(/Đã tạo và chọn chapter mới/)).toBeInTheDocument();
  });
});
