import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  generateCourseDraft: vi.fn(),
  generateLessonDraft: vi.fn(),
}));

vi.mock("@/features/content-pipeline/services/content-pipeline-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/content-pipeline/services/content-pipeline-service")>();
  return { ...actual, ...serviceMocks };
});

import { POST } from "../content-sources/[id]/generate/route";

describe("Admin content generation route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("uses Course batch generation when no target Lesson is supplied", async () => {
    serviceMocks.generateCourseDraft.mockResolvedValue({ courseId: 31, lessonDraftIds: [71, 72] });
    const response = await POST(
      new Request("http://localhost", { method: "POST", body: "{}" }),
      { params: Promise.resolve({ id: "9" }) }
    );
    expect(response.status).toBe(201);
    expect(serviceMocks.generateCourseDraft).toHaveBeenCalledWith("9");
    expect(serviceMocks.generateLessonDraft).not.toHaveBeenCalled();
  });

  it("keeps the explicit target Lesson compatibility path", async () => {
    serviceMocks.generateLessonDraft.mockResolvedValue({ lessonDraftId: 71 });
    await POST(
      new Request("http://localhost", { method: "POST", body: JSON.stringify({ targetLessonId: 51 }) }),
      { params: Promise.resolve({ id: "9" }) }
    );
    expect(serviceMocks.generateLessonDraft).toHaveBeenCalledWith("9", 51);
    expect(serviceMocks.generateCourseDraft).not.toHaveBeenCalled();
  });
});
