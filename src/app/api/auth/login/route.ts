import { authService } from "@/features/auth/auth.service";
import { loginSchema } from "@/features/auth/auth.schema";
import { checkRateLimit } from "@/lib/rate-limiter";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = await checkRateLimit("auth:login", ip);

    if (!rateLimit.allowed) {
      return Response.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds),
          },
        }
      );
    }

    const json = await request.json().catch(() => ({}));
    const validated = loginSchema.parse(json);
    const result = await authService.login(validated);

    return Response.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    return authService.handleRouteError(error);
  }
}
