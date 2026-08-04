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

interface OpenAIChatResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  model?: string;
}

export class OpenAIApiProvider implements AIProvider {
  constructor(
    private readonly apiKey = process.env.AI_API_KEY,
    private readonly endpoint = process.env.AI_PROVIDER_URL ??
      "https://api.openai.com/v1/chat/completions",
    private readonly model = process.env.AI_PROVIDER_MODEL ?? "gpt-4o-mini"
  ) {}

  async generateExplanation(
    request: AiProviderRequest
  ): Promise<AiProviderResponse> {
    if (!this.apiKey) {
      throw new Error("AI_PROVIDER_NOT_CONFIGURED");
    }

    const { submission, question } = request;

    const systemPrompt = `Bạn là một gia sư AI thân thiện, chuyên hỗ trợ học viên giải bài tập.
Thông tin bài tập:
- Tiêu đề: ${submission.exerciseTitle}
- Đề bài: ${submission.exercisePrompt}

Học viên đã nộp đáp án: ${JSON.stringify(submission.answer)}
Kết quả chấm tự động: ${submission.isCorrect ? "Đúng" : "Sai"}
Giải thích tĩnh của bài (nếu có): ${submission.staticExplanation ?? "Không có"}

Hãy dựa vào các thông tin trên để phân tích ngắn gọn, dễ hiểu vì sao đáp án của học viên đúng hoặc sai. Nếu học viên có câu hỏi, hãy trả lời trực tiếp vào câu hỏi đó. Sử dụng ngôn ngữ tiếng Việt tự nhiên, khuyến khích học viên. Trả về định dạng Markdown.`;

    const userContent = question
      ? `Học viên hỏi: ${question}`
      : "Vui lòng giải thích kết quả bài làm giúp tôi.";

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error("AI_PROVIDER_REQUEST_FAILED");
    }

    const payload = (await response.json()) as OpenAIChatResponse;
    const explanation = payload.choices?.[0]?.message?.content;

    if (!explanation?.trim()) {
      throw new Error("AI_RESPONSE_INVALID");
    }

    return {
      explanation: explanation.trim(),
      provider: "openai-compatible",
      model: payload.model ?? this.model,
    };
  }
}

export function createAIProvider(): AIProvider {
  return process.env.AI_API_KEY ? new OpenAIApiProvider() : new MockAIProvider();
}
