import { describe, expect, it } from "vitest";
import { validateGeneratedExerciseContent, validateGeneratedExerciseDraft } from "./exercise-draft";

const content = {
  title: "Dự đoán kết quả",
  description: "Chương trình in gì?",
  codeSnippet: "x = 1\nprint(x)",
  options: ["1", "2"],
  correctAnswer: "1",
  explanation: "x được gán giá trị 1.",
};

describe("generated Exercise draft validation", () => {
  it("normalizes a complete strict content payload", () => {
    expect(validateGeneratedExerciseContent({ ...content, title: ` ${content.title} ` })).toEqual(content);
  });

  it("rejects unknown fields, duplicate options, and an answer outside the options", () => {
    expect(() => validateGeneratedExerciseContent({ ...content, leakedSolution: true })).toThrow("EXERCISE_DRAFT_INVALID");
    expect(() => validateGeneratedExerciseContent({ ...content, options: ["1", "1"] })).toThrow("EXERCISE_DRAFT_INVALID");
    expect(() => validateGeneratedExerciseContent({ ...content, correctAnswer: "3" })).toThrow("EXERCISE_DRAFT_INVALID");
  });

  it("requires the editable wrapper and content title/description to agree", () => {
    expect(() => validateGeneratedExerciseDraft({
      title: "Khác",
      description: content.description,
      exerciseType: "predict_output",
      difficulty: "easy",
      content,
    })).toThrow("EXERCISE_DRAFT_INVALID");
  });
});
