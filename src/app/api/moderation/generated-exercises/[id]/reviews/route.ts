import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ModerationService } from "@/features/moderation/services/moderation-service";
import type { ReviewStatus } from "@/features/moderation/types";
import { checkRateLimit } from "@/lib/rate-limiter";

export const runtime = "nodejs";

const moderationService = new ModerationService();

async function checkModeratorAccess(client: ReturnType<typeof createServerSupabaseClient>) {
  const supabase = await client;
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized", status: 401, user: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !profile.is_active || !["moderator", "admin"].includes(profile.role)) {
    return { error: "Forbidden: Moderators only", status: 403, user: null };
  }

  return { error: null, status: 200, user };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createServerSupabaseClient();
  const access = await checkModeratorAccess(supabase);
  
  if (access.error || !access.user) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const rateLimit = await checkRateLimit("moderation:mutations", access.user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limited" },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      }
    );
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid exercise ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { decision, status, comment, feedback, editedDraft } = body;
    const reviewDecision = decision ?? status;
    const reviewComment = comment ?? feedback;

    if (!["approved", "rejected", "needs_revision"].includes(reviewDecision)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const client = await supabase;
    const result = await moderationService.submitReview(client, access.user.id, {
      generatedExerciseId: id,
      status: reviewDecision as ReviewStatus,
      feedback: typeof reviewComment === "string" ? reviewComment : undefined,
      editedDraft: editedDraft && typeof editedDraft === "object" ? editedDraft : undefined,
    });

    return NextResponse.json({
      reviewId: result.id,
      generatedExerciseId: result.generatedExerciseId,
      reviewerId: result.reviewerId,
      decision: result.status,
      status: result.status,
      comment: result.feedback,
      reviewedAt: result.createdAt,
    });
  } catch (error: unknown) {
    console.error("[Moderation API - POST generated-exercises/:id/reviews]", error);
    if (error instanceof Error && error.message.includes("not found")) {
        return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }
    if (error instanceof Error && (
      error.message.includes("EXERCISE_DRAFT_INVALID") ||
      error.message.includes("at most 2000") ||
      error.message.includes("Review status")
    )) {
      return NextResponse.json({ error: "Invalid review payload" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
