import "server-only";

import type { SubmissionDetailsForAi } from "@/features/ai/types";

export interface AiProviderRequest {
  submission: SubmissionDetailsForAi;
  question: string | null;
}

export interface AiProviderResponse {
  explanation: string;
  provider: string;
  model: string | null;
}

export interface AIProvider {
  generateExplanation(request: AiProviderRequest): Promise<AiProviderResponse>;
}

export class MockAIProvider implements AIProvider {
  async generateExplanation({
    submission,
    question,
  }: AiProviderRequest): Promise<AiProviderResponse> {
    const outcome = submission.isCorrect
      ? "Bài làm của bạn là chính xác."
      : "Bài làm của bạn chưa chính xác.";

    return {
      explanation: [
        outcome,
        submission.staticExplanation ??
          `Hãy xem lại yêu cầu của bài "${submission.exerciseTitle}" và so sánh đáp án đã nộp với các lựa chọn.`,
        question ? `Câu hỏi của bạn: ${question}` : null,
      ]
        .filter(Boolean)
        .join("\n\n"),
      provider: "mock",
      model: null,
    };
  }
}

interface RestProviderPayload {
  explanation?: unknown;
  response?: unknown;
  model?: unknown;
}

export class RestAIProvider implements AIProvider {
  constructor(
    private readonly endpoint = process.env.AI_PROVIDER_URL,
    private readonly apiKey = process.env.AI_PROVIDER_API_KEY,
    private readonly model = process.env.AI_PROVIDER_MODEL ?? null
  ) {}

  async generateExplanation(
    request: AiProviderRequest
  ): Promise<AiProviderResponse> {
    if (!this.endpoint) {
      throw new Error("AI_PROVIDER_NOT_CONFIGURED");
    }

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        question: request.question,
        submission: {
          answer: request.submission.answer,
          isCorrect: request.submission.isCorrect,
          exerciseTitle: request.submission.exerciseTitle,
          exercisePrompt: request.submission.exercisePrompt,
          staticExplanation: request.submission.staticExplanation,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("AI_PROVIDER_REQUEST_FAILED");
    }

    const payload = (await response.json()) as RestProviderPayload;
    const explanation =
      typeof payload.explanation === "string"
        ? payload.explanation
        : typeof payload.response === "string"
          ? payload.response
          : null;

    if (!explanation?.trim()) {
      throw new Error("AI_RESPONSE_INVALID");
    }

    return {
      explanation: explanation.trim(),
      provider: "rest",
      model: typeof payload.model === "string" ? payload.model : this.model,
    };
  }
}

export function createAIProvider(): AIProvider {
  return process.env.AI_PROVIDER_URL ? new RestAIProvider() : new MockAIProvider();
}