import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  createNewContentTarget: vi.fn(),
  getContentTargets: vi.fn(),
}));

vi.mock("@/features/content-pipeline/services/content-pipeline-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/content-pipeline/services/content-pipeline-service")>();
  return { ...actual, ...serviceMocks };
});

import { GET, POST } from "../content-targets/route";

describe("admin content target routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lists lessons and chapters", async () => {
    serviceMocks.getContentTargets.mockResolvedValue({ items: [], chapters: [], courses: [] });
    const response = await GET();
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { items: [], chapters: [], courses: [] },
    });
  });

  it("creates a new target lesson", async () => {
    const target = {
      lessonId: 8,
      lessonTitle: "Bài mới",
      chapterId: 2,
      chapterTitle: "Cơ bản",
      courseId: 1,
      courseTitle: "Python",
    };
    serviceMocks.createNewContentTarget.mockResolvedValue(target);
    const response = await POST(new Request("http://localhost/api/admin/content-targets", {
      method: "POST",
      body: JSON.stringify({ chapterId: 2, title: "Bài mới" }),
    }));

    expect(response.status).toBe(201);
    expect(serviceMocks.createNewContentTarget).toHaveBeenCalledWith({ chapterId: 2, title: "Bài mới" });
    await expect(response.json()).resolves.toEqual({ success: true, data: target });
  });
});
