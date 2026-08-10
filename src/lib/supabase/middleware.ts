import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/generated/database.types";

const PUBLIC_PAGE_PATTERNS = [
  /^\/$/,
  /^\/(?:login|register|forgot-password|reset-password)\/?$/,
  /^\/courses\/?$/,
  /^\/courses\/[^/]+\/?$/,
];

function isPublicPage(pathname: string) {
  return PUBLIC_PAGE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function shouldRunPageSessionGuard(pathname: string) {
  const isApiRequest = pathname === "/api" || pathname.startsWith("/api/");
  return !isApiRequest && !isPublicPage(pathname);
}

export function shouldRedirectToLogin(pathname: string, hasUser: boolean) {
  const isApiRequest = pathname === "/api" || pathname.startsWith("/api/");
  return !hasUser && !isApiRequest && !isPublicPage(pathname);
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!shouldRunPageSessionGuard(pathname)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          Object.entries(headersToSet).forEach(([name, value]) =>
            supabaseResponse.headers.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Keep session verification adjacent to client creation so cookie refreshes remain reliable.
  const { data: claimsData } = await supabase.auth.getClaims();
  let hasUser = Boolean(claimsData?.claims.sub);
  const hasAuthCookie = request.cookies.getAll().some(({ name }) =>
    /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
  if (!hasUser && hasAuthCookie) {
    const { data: userData } = await supabase.auth.getUser();
    hasUser = Boolean(userData.user);
  }

  // Route Handlers own their JSON authentication and authorization contract.
  // Redirecting an API request to an HTML login page breaks auth submissions
  // and hides the endpoint's intended 401/403 response from API consumers.
  if (shouldRedirectToLogin(pathname, hasUser)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
