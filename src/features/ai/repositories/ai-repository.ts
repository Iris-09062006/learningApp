import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { AiExplanationRecord, SubmissionDetailsForAi } from "@/features/ai/types";
import type { Database } from "@/generated/database.types";

type AiExplanationInsert = Database["public"]["Tables"]["ai_explanations"]["Insert"];
type AiExplanationRow = Database["public"]["Tables"]["ai_explanations"]["Row"];

function mapAiExplanationRow(row: AiExplanationRow): AiExplanationRecord {
  return {
    id: row.id,
    submissionId: row.submission_id,
    userQuestion: row.user_question,
    response: row.response,
    provider: row.provider,
    model: row.model,
    status: row.status,
    errorCode: row.error_code,
    createdAt: row.created_at,
  };
}

export async function fetchSubmissionDetailsForAi(
  submissionId: number
): Promise<SubmissionDetailsForAi | null> {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("UNAUTHENTICATED");
  }

  const { data: submission, error: subError } = await supabase
    .from("submissions")
    .select("id, user_id, exercise_id, answer, is_correct")
    .eq("id", submissionId)
    .single();

  if (subError || !submission) {
    return null;
  }

  if (submission.user_id !== authData.user.id) {
    throw new Error("FORBIDDEN");
  }

  const { data: exercise } = await supabase
    .from("exercises")
    .select("title, description")
    .eq("id", submission.exercise_id)
    .single();

  const adminClient = createAdminSupabaseClient();
  const { data: solution } = await adminClient
    .from("exercise_solutions")
    .select("static_explanation")
    .eq("exercise_id", submission.exercise_id)
    .maybeSingle();

  return {
    id: submission.id,
    userId: submission.user_id,
    exerciseId: submission.exercise_id,
    answer: submission.answer,
    isCorrect: submission.is_correct,
    exerciseTitle: exercise?.title ?? "Bài tập",
    exercisePrompt: exercise?.description ?? "",
    staticExplanation: solution?.static_explanation ?? null,
  };
}

export async function fetchAiExplanationBySubmissionId(
  submissionId: number
): Promise<AiExplanationRecord | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("ai_explanations")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapAiExplanationRow(data);
}

export async function fetchAiExplanationHistory(
  submissionId: number
): Promise<AiExplanationRecord[]> {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error("UNAUTHENTICATED");
  }

  // Check submission ownership first
  const { data: submission } = await supabase
    .from("submissions")
    .select("user_id")
    .eq("id", submissionId)
    .single();

  if (!submission || submission.user_id !== authData.user.id) {
    throw new Error("FORBIDDEN");
  }

  const { data, error } = await supabase
    .from("ai_explanations")
    .select("*")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("DATABASE_ERROR");
  }

  return (data || []).map(mapAiExplanationRow);
}

export async function createAiExplanationRecord(
  payload: AiExplanationInsert
): Promise<AiExplanationRecord> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("ai_explanations")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create AI explanation record: ${error?.message || "Unknown error"}`);
  }

  return mapAiExplanationRow(data);
}