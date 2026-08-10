import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createContentTarget: vi.fn(),
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/features/content-pipeline/repositories/content-pipeline-repository", () => ({
  createContentTarget: mocks.createContentTarget,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import { ContentPipelineError, createNewContentTarget } from "./content-pipeline-service";

describe("createNewContentTarget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { role: "admin", is_active: true } }),
          }),
        }),
      }),
    });
  });

  it("validates and trims the new lesson target", async () => {
    mocks.createContentTarget.mockResolvedValue({ lessonId: 9 });

    await createNewContentTarget({ chapterId: 2, title: "  Bài mới  " });

    expect(mocks.createContentTarget).toHaveBeenCalledWith({ chapterId: 2, title: "Bài mới" });
  });

  it("maps a missing chapter to the public not-found contract", async () => {
    mocks.createContentTarget.mockRejectedValue(new Error("CHAPTER_NOT_FOUND"));

    await expect(createNewContentTarget({ chapterId: 999, title: "Bài mới" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" } satisfies Partial<ContentPipelineError>);
  });

  it("rejects blank lesson titles before repository access", async () => {
    await expect(createNewContentTarget({ chapterId: 2, title: "   " }))
      .rejects.toMatchObject({ code: "VALIDATION_ERROR" } satisfies Partial<ContentPipelineError>);
    expect(mocks.createContentTarget).not.toHaveBeenCalled();
  });
});
