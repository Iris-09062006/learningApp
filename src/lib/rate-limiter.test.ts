import { afterEach, describe, expect, it } from "vitest";
import {
  checkRateLimit,
  resetRateLimitBuckets,
} from "./rate-limiter";

describe("rate limiter", () => {
  afterEach(() => {
    resetRateLimitBuckets();
  });

  it("allows requests under the limit", () => {
    for (let i = 0; i < 5; i += 1) {
      expect(checkRateLimit("auth:forgot-password", "1.2.3.4")).toEqual({
        allowed: true,
      });
    }
  });

  it("rejects the request after the limit is exceeded", () => {
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit("auth:forgot-password", "1.2.3.4");
    }

    const result = checkRateLimit("auth:forgot-password", "1.2.3.4");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("tracks different identifiers independently", () => {
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit("auth:forgot-password", "1.2.3.4");
    }

    expect(checkRateLimit("auth:forgot-password", "5.6.7.8")).toEqual({
      allowed: true,
    });
  });

  it("returns allowed for unknown scopes", () => {
    expect(checkRateLimit("unknown:scope", "1.2.3.4")).toEqual({
      allowed: true,
    });
  });
});