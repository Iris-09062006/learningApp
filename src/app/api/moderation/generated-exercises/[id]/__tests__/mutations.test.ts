import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/generated/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { checkRateLimit, resetRateLimitBuckets } from "@/lib/rate-limiter";
import { POST as publishExercise } from "../publish/route";
import { POST as reviewExercise } from "../reviews/route";

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(),
}));

vi.mock("@/features/moderation/services/moderation-service", () => ({
  ModerationService: vi.fn().mockImplementation(() => ({
    publishExercise: vi.fn().mockResolvedValue({ id: 1, status: "published" }),
    submitReview: vi.fn().mockResolvedValue({ id: 1, status: "approved" }),
  })),
}));

describe("moderation mutation abuse controls", () => {
  const userId = "moderator-1";
  const mockSupabase = {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitBuckets();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: "moderator", is_active: true },
            error: null,
          }),
        }),
      }),
    });
    vi.mocked(createServerSupabaseClient).mockResolvedValue(
      mockSupabase as unknown as SupabaseClient<Database>,
    );
  });

  async function exhaustMutationLimit(): Promise<void> {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await expect(checkRateLimit("moderation:mutations", userId)).resolves.toEqual({
        allowed: true,
      });
    }
  }

  it("returns 429 for review mutations after the per-user limit", async () => {
    await exhaustMutationLimit();
    const response = await reviewExercise(
      new NextRequest("http://localhost/api/moderation/generated-exercises/1/reviews", {
        method: "POST",
        body: JSON.stringify({ status: "approved" }),
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });

  it("returns 429 for publish mutations after the per-user limit", async () => {
    await exhaustMutationLimit();
    const response = await publishExercise(
      new NextRequest("http://localhost/api/moderation/generated-exercises/1/publish", {
        method: "POST",
      }),
      { params: Promise.resolve({ id: "1" }) },
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });
});
