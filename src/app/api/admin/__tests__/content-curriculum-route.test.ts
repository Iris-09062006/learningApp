import { describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({ createNewContentCurriculum: vi.fn() }));

vi.mock("@/features/content-pipeline/services/content-pipeline-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/content-pipeline/services/content-pipeline-service")>();
  return { ...actual, ...serviceMocks };
});

import { POST } from "../content-curriculum/route";

describe("admin content curriculum route", () => {
  it("creates a source-backed destination", async () => {
    serviceMocks.createNewContentCurriculum.mockResolvedValue({
      courseId: 1,
      courseTitle: "Toán ứng dụng",
      chapterId: 2,
      chapterTitle: "Nội suy",
      lessonId: 3,
      lessonTitle: "Nội suy",
    });

    const response = await POST(new Request("http://localhost/api/admin/content-curriculum", {
      method: "POST",
      body: JSON.stringify({ mode: "new", courseTitle: "Toán ứng dụng", sourceDocumentId: 9 }),
    }));

    expect(response.status).toBe(201);
    expect(serviceMocks.createNewContentCurriculum).toHaveBeenCalledWith({
      mode: "new",
      courseTitle: "Toán ứng dụng",
      sourceDocumentId: 9,
    });
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { courseId: 1, chapterId: 2, lessonId: 3 },
    });
  });
});
