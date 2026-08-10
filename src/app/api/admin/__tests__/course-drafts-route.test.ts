import { beforeEach, describe, expect, it, vi } from "vitest";

const serviceMocks = vi.hoisted(() => ({
  getCourseDraftQueue: vi.fn(),
  submitCourseImportReview: vi.fn(),
}));

vi.mock("@/features/content-pipeline/services/content-pipeline-service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/content-pipeline/services/content-pipeline-service")>();
  return { ...actual, ...serviceMocks };
});

import { GET } from "../course-drafts/route";
import { POST } from "../course-drafts/[id]/reviews/route";

describe("Admin Course draft routes", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the unresolved Course batch queue without caching", async () => {
    serviceMocks.getCourseDraftQueue.mockResolvedValue([{ sourceDocumentId: 9 }]);
    const response = await GET();
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: { items: [{ sourceDocumentId: 9 }] },
    });
  });

  it("submits one persisted decision for the Course import job", async () => {
    serviceMocks.submitCourseImportReview.mockResolvedValue({
      sourceDocumentId: 9,
      courseId: 31,
      status: "published",
      lessonIds: [51, 52],
    });
    const response = await POST(
      new Request("http://localhost/api/admin/course-drafts/9/reviews", {
        method: "POST",
        body: JSON.stringify({ decision: "published" }),
      }),
      { params: Promise.resolve({ id: "9" }) }
    );
    expect(response.status).toBe(201);
    expect(serviceMocks.submitCourseImportReview).toHaveBeenCalledWith("9", { decision: "published" });
  });
});
