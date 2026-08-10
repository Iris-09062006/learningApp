import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  createGeneratedExerciseRecord: vi.fn(),
  fetchLessonContextForGeneration: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
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
  beforeEach(() => vi.clearAllMocks());

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
    mocks.fetchLessonContextForGeneration.mockResolvedValue({ title: "Biến", content: "x = 1" });
    mocks.createGeneratedExerciseRecord.mockResolvedValue({ id: 88, lessonId: 51 });
    const provider: AIProvider = {
      generateExplanation: vi.fn(),
      generateExercise: vi.fn().mockResolvedValue({
        content: {
          title: "Dự đoán",
          description: "Kết quả là gì?",
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
    }));
    expect(mocks.createGeneratedExerciseRecord).toHaveBeenCalledWith(expect.objectContaining({
      lesson_id: 51,
      status: "pending",
    }));
  });
});
