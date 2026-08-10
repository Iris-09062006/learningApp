// @vitest-environment node

import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerClient: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

import { shouldRedirectToLogin, shouldRunPageSessionGuard, updateSession } from "./middleware";
import { config as middlewareConfig } from "../../middleware";

interface MiddlewareCookieAdapter {
  setAll: (
    cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>,
    headers: Record<string, string>,
  ) => void;
}

describe("Supabase middleware route policy", () => {
  afterEach(() => vi.clearAllMocks());

  it.each([
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/courses",
    "/courses/python-foundations",
  ])("allows guest access to public page %s", (pathname) => {
    expect(shouldRedirectToLogin(pathname, false)).toBe(false);
  });

  it.each([
    "/api/auth/login",
    "/api/auth/register",
    "/api/system/health",
    "/api/profile",
  ])("leaves API authentication to the Route Handler for %s", (pathname) => {
    expect(shouldRedirectToLogin(pathname, false)).toBe(false);
  });

  it("excludes API requests from the middleware matcher", () => {
    expect(middlewareConfig.matcher[0]).toContain("api(?:/|$)");
  });

  it("skips Supabase middleware work for public pages and APIs", () => {
    expect(shouldRunPageSessionGuard("/courses")).toBe(false);
    expect(shouldRunPageSessionGuard("/api/profile")).toBe(false);
    expect(shouldRunPageSessionGuard("/dashboard")).toBe(true);
  });

  it.each([
    "/dashboard",
    "/profile",
    "/courses/python-foundations/roadmap",
    "/lessons/lesson-1",
    "/moderation",
    "/admin/users",
  ])("redirects a guest from protected page %s", (pathname) => {
    expect(shouldRedirectToLogin(pathname, false)).toBe(true);
  });

  it("allows an authenticated user to open a protected page", () => {
    expect(shouldRedirectToLogin("/dashboard", true)).toBe(false);
  });

  it("forwards Supabase anti-cache headers when refreshed cookies are set", async () => {
    mocks.createServerClient.mockImplementation(
      (_url: string, _key: string, options: { cookies: MiddlewareCookieAdapter }) => ({
        auth: {
          getClaims: async () => {
            options.cookies.setAll(
              [{ name: "session", value: "refreshed", options: { path: "/" } }],
              {
                "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
                Expires: "0",
                Pragma: "no-cache",
              },
            );
            return { data: { claims: { sub: "user-1" } } };
          },
        },
      }),
    );

    const response = await updateSession(new NextRequest("http://localhost:3000/dashboard"));

    expect(response.headers.get("cache-control")).toBe(
      "private, no-cache, no-store, must-revalidate, max-age=0",
    );
    expect(response.headers.get("expires")).toBe("0");
    expect(response.headers.get("pragma")).toBe("no-cache");
    expect(response.cookies.get("session")?.value).toBe("refreshed");
  });

  it("uses verified JWT claims instead of a remote user lookup", async () => {
    const getClaims = vi.fn().mockResolvedValue({ data: { claims: { sub: "user-1" } } });
    const getUser = vi.fn();
    mocks.createServerClient.mockReturnValue({ auth: { getClaims, getUser } });

    const response = await updateSession(new NextRequest("http://localhost:3000/dashboard"));

    expect(response.status).toBe(200);
    expect(getClaims).toHaveBeenCalledOnce();
    expect(getUser).not.toHaveBeenCalled();
  });

  it("falls back to the authenticated user endpoint when a session cookie has no claims", async () => {
    const getClaims = vi.fn().mockResolvedValue({ data: null });
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } });
    mocks.createServerClient.mockReturnValue({ auth: { getClaims, getUser } });
    const request = new NextRequest("http://localhost:3000/dashboard", {
      headers: { cookie: "sb-local-auth-token=e2e-session" },
    });

    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(getClaims).toHaveBeenCalledOnce();
    expect(getUser).toHaveBeenCalledOnce();
  });
});
