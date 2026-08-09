import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "../route";
import { AiServiceError, requestAiExplanation } from "@/features/ai/services/ai-service";
import { requireUser } from "@/lib/auth/session";
import { resetRateLimitBuckets } from "@/lib/rate-limiter";

vi.mock("@/features/ai/services/ai-service", () => ({
  AiServiceError: class AiServiceError extends Error {
    constructor(
      public readonly code: string,
      message: string
    ) {
      super(message);
    }
  },
  requestAiExplanation: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  InactiveAccountError: class InactiveAccountError extends Error {},
  UnauthenticatedError: class UnauthenticatedError extends Error {},
  requireUser: vi.fn(),
}));

describe("POST /api/ai/explanations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitBuckets();
    vi.mocked(requireUser).mockResolvedValue({ id: "user-1" } as never);
  });

  it("returns 400 when body is invalid JSON", async () => {
    const req = new Request("http://localhost/api/ai/explanations", {
      method: "POST",
      body: "{invalid-json",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when submissionId is invalid", async () => {
    const req = new Request("http://localhost/api/ai/explanations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: "abc" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 200 and explanation data on success", async () => {
    const mockRecord = {
      id: 1,
      submissionId: 10,
      userQuestion: "Explain this",
      response: "Detailed explanation",
      provider: "mock",
      model: null,
      status: "success" as const,
      errorCode: null,
      createdAt: "2026-08-01T00:00:00Z",
    };

    vi.mocked(requestAiExplanation).mockResolvedValueOnce(mockRecord);

    const req = new Request("http://localhost/api/ai/explanations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: 10, question: "Explain this" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.explanation).toEqual(mockRecord);
  });

  it("maps AiServiceError code to appropriate status", async () => {
    vi.mocked(requestAiExplanation).mockRejectedValueOnce(
      new AiServiceError("AI_PROVIDER_ERROR", "Provider timeout")
    );

    const req = new Request("http://localhost/api/ai/explanations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: 10 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error.code).toBe("AI_PROVIDER_ERROR");
  });

  it("rate limits AI explanations by authenticated user", async () => {
    const mockRecord = {
      id: 1,
      submissionId: 10,
      userQuestion: null,
      response: "Explanation",
      provider: "mock",
      model: null,
      status: "success" as const,
      errorCode: null,
      createdAt: "2026-08-01T00:00:00Z",
    };
    vi.mocked(requestAiExplanation).mockResolvedValue(mockRecord);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await POST(new Request("http://localhost/api/ai/explanations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: 10 }),
      }));
      expect(response.status).toBe(200);
    }

    const limited = await POST(new Request("http://localhost/api/ai/explanations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: 10 }),
    }));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBeTruthy();
  });
});
