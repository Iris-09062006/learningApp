import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  createGeneratedExerciseRecord: vi.fn(),
  fetchLessonContextForGeneration: vi.fn(),
  checkRateLimit: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

vi.mock("@/lib/rate-limiter", () => ({
  checkRateLimit: mocks.checkRateLimit,
}));

vi.mock("../../repositories/ai-repository", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../repositories/ai-repository")>();
  return {
    ...actual,
    createGeneratedExerciseRecord: mocks.createGeneratedExerciseRecord,
    fetchLessonContextForGeneration: mocks.fetchLessonContextForGeneration,
  };
});

import type { AIProvider } from "../../providers/ai-provider";
import { AiServiceError, generateExercise } from "../ai-service";

function serverClient(profile: { role: string; is_active: boolean } | null) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "actor-1" } }, error: null }) },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }),
        }),
      }),
    }),
  };
}

describe("Lesson-scoped AI exercise generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, remaining: 19, retryAfterSeconds: 0 });
  });

  it("rejects an inactive or non-privileged actor before reading Lesson context or calling AI", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue(serverClient({ role: "learner", is_active: true }));
    const provider: AIProvider = {
      generateExplanation: vi.fn(),
      generateExercise: vi.fn(),
    };

    await expect(generateExercise({
      lessonId: 51,
      exerciseType: "predict_output",
      difficulty: "easy",
      learningObjective: "Hiểu phép gán",
    }, provider)).rejects.toEqual(expect.objectContaining({ code: "FORBIDDEN" }) satisfies Partial<AiServiceError>);
    expect(mocks.fetchLessonContextForGeneration).not.toHaveBeenCalled();
    expect(provider.generateExercise).not.toHaveBeenCalled();
  });

  it("uses only the selected Lesson context and persists its lesson_id", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue(serverClient({ role: "admin", is_active: true }));
    mocks.fetchLessonContextForGeneration.mockResolvedValue({
      lessonId: 51,
      lessonTitle: "Biến",
      lessonContent: "x = 1",
      learningObjectives: ["Hiểu phép gán"],
      courseTitle: "Python cơ bản",
      courseDescription: "Nhập môn Python",
    });
    mocks.createGeneratedExerciseRecord.mockResolvedValue({ id: 88, lessonId: 51 });
    const provider: AIProvider = {
      generateExplanation: vi.fn(),
      generateExercise: vi.fn().mockResolvedValue({
        content: {
          title: "Dự đoán",
          description: "Kết quả là gì?",
          codeSnippet: "x = 1\nprint(x)",
          options: ["1", "2"],
          correctAnswer: "1",
          explanation: "x nhận 1",
        },
        provider: "mock",
        model: null,
      }),
    };

    await generateExercise({
      lessonId: 51,
      exerciseType: "predict_output",
      difficulty: "easy",
      learningObjective: "Hiểu phép gán",
    }, provider);

    expect(provider.generateExercise).toHaveBeenCalledWith(expect.objectContaining({
      lessonTitle: "Biến",
      lessonContent: "x = 1",
      lessonLearningObjectives: ["Hiểu phép gán"],
      courseTitle: "Python cơ bản",
      courseDescription: "Nhập môn Python",
    }));
    expect(mocks.createGeneratedExerciseRecord).toHaveBeenCalledWith(expect.objectContaining({
      lesson_id: 51,
    }));
  });

  it("rate-limits an active privileged actor before reading Lesson context", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue(serverClient({ role: "admin", is_active: true }));
    mocks.checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0, retryAfterSeconds: 42 });
    const provider: AIProvider = { generateExplanation: vi.fn(), generateExercise: vi.fn() };

    await expect(generateExercise({
      lessonId: 51,
      exerciseType: "predict_output",
      difficulty: "easy",
      learningObjective: "Hiểu phép gán",
    }, provider)).rejects.toEqual(expect.objectContaining({ code: "RATE_LIMITED" }) satisfies Partial<AiServiceError>);
    expect(mocks.fetchLessonContextForGeneration).not.toHaveBeenCalled();
    expect(provider.generateExercise).not.toHaveBeenCalled();
  });
});
