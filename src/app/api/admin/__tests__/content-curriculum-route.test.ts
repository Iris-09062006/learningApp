import { describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({ createNewContentCurriculum: vi.fn() }));

vi.mock("@/features/content-pipeline/services/content-pipeline-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/content-pipeline/services/content-pipeline-service")>();
  return { ...actual, ...serviceMocks };
});

import { POST } from "../content-curriculum/route";

describe("admin content curriculum route", () => {
  it("creates a course and first chapter", async () => {
    serviceMocks.createNewContentCurriculum.mockResolvedValue({
      courseId: 1,
      courseTitle: "Toán ứng dụng",
      chapterId: 2,
      chapterTitle: "Nội suy",
    });

    const response = await POST(new Request("http://localhost/api/admin/content-curriculum", {
      method: "POST",
      body: JSON.stringify({ courseTitle: "Toán ứng dụng", chapterTitle: "Nội suy" }),
    }));

    expect(response.status).toBe(201);
    expect(serviceMocks.createNewContentCurriculum).toHaveBeenCalledWith({
      courseTitle: "Toán ứng dụng",
      chapterTitle: "Nội suy",
    });
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { courseId: 1, chapterId: 2 },
    });
  });
});
