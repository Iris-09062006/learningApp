import "server-only";

import {
  createAIProvider,
  type AIProvider,
} from "@/features/ai/providers/ai-provider";
import {
  createAiExplanationRecord,
  fetchAiExplanationHistory,
  fetchSubmissionDetailsForAi,
} from "@/features/ai/repositories/ai-repository";
import type {
  AiExplanationRecord,
  RequestAiExplanationInput,
} from "@/features/ai/types";

export class AiServiceError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "AI_PROVIDER_ERROR"
      | "DATABASE_ERROR",
    message: string
  ) {
    super(message);
    this.name = "AiServiceError";
  }
}

function asAiServiceError(error: unknown): AiServiceError | null {
  if (!(error instanceof Error)) {
    return null;
  }

  if (error.message === "UNAUTHENTICATED") {
    return new AiServiceError("UNAUTHENTICATED", "Authentication is required.");
  }

  if (error.message === "FORBIDDEN") {
    return new AiServiceError("FORBIDDEN", "You cannot access this submission.");
  }

  return null;
}

export async function requestAiExplanation(
  input: RequestAiExplanationInput,
  provider: AIProvider = createAIProvider()
): Promise<AiExplanationRecord> {
  let submission;

  try {
    submission = await fetchSubmissionDetailsForAi(input.submissionId);
  } catch (error: unknown) {
    const serviceError = asAiServiceError(error);

    if (serviceError) {
      throw serviceError;
    }

    throw new AiServiceError(
      "DATABASE_ERROR",
      "Unable to load the submission for AI explanation."
    );
  }

  if (!submission) {
    throw new AiServiceError("NOT_FOUND", "Submission not found.");
  }

  const question = input.userQuestion?.trim() || null;

  try {
    const generated = await provider.generateExplanation({ submission, question });

    return await createAiExplanationRecord({
      submission_id: submission.id,
      user_question: question,
      response: generated.explanation,
      provider: generated.provider,
      model: generated.model,
      status: "success",
      error_code: null,
    });
  } catch (error: unknown) {
    if (error instanceof AiServiceError) {
      throw error;
    }

    try {
      await createAiExplanationRecord({
        submission_id: submission.id,
        user_question: question,
        response: null,
        provider: "unknown",
        model: null,
        status: "failed",
        error_code:
          error instanceof Error && error.message === "AI_RESPONSE_INVALID"
            ? "AI_RESPONSE_INVALID"
            : "AI_PROVIDER_ERROR",
      });
    } catch (recordError: unknown) {
      console.error("[AI explanation failure persistence]", recordError);
    }

    console.error("[AI explanation provider]", error);
    throw new AiServiceError(
      "AI_PROVIDER_ERROR",
      "Unable to generate an explanation at this time."
    );
  }
}

export async function getAiExplanationHistory(
  submissionId: number
): Promise<AiExplanationRecord[]> {
  try {
    return await fetchAiExplanationHistory(submissionId);
  } catch (error: unknown) {
    const serviceError = asAiServiceError(error);

    if (serviceError) {
      throw serviceError;
    }

    if (error instanceof Error && error.message === "DATABASE_ERROR") {
      throw new AiServiceError(
        "DATABASE_ERROR",
        "Unable to load AI explanation history."
      );
    }

    throw new AiServiceError("FORBIDDEN", "You cannot access this submission.");
  }
}