import { render, screen, waitFor } from "@testing-library/react";
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
});
