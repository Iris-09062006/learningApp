import type {
  DbDifficultyLevel,
  DbExerciseType,
  GeneratedExerciseContent,
  GeneratedExerciseDraft,
} from "@/features/ai/types";

const TYPES = new Set<DbExerciseType>(["predict_output", "fix_the_bug"]);
const DIFFICULTIES = new Set<DbDifficultyLevel>(["easy", "medium", "hard"]);

function onlyKeys(record: Record<string, unknown>, allowed: readonly string[]) {
  const keys = new Set(allowed);
  return Object.keys(record).every((key) => keys.has(key));
}

export function validateGeneratedExerciseContent(value: unknown): GeneratedExerciseContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("EXERCISE_DRAFT_INVALID");
  const record = value as Record<string, unknown>;
  if (!onlyKeys(record, ["title", "description", "codeSnippet", "options", "correctAnswer", "explanation"]) ||
    typeof record.title !== "string" || !record.title.trim() || record.title.trim().length > 150 ||
    typeof record.description !== "string" || !record.description.trim() || record.description.trim().length > 2000 ||
    typeof record.codeSnippet !== "string" || record.codeSnippet.length > 10_000 ||
    !Array.isArray(record.options) || record.options.length < 2 || record.options.length > 6 ||
    !record.options.every((option) => typeof option === "string" && option.trim() && option.trim().length <= 500) ||
    typeof record.correctAnswer !== "string" || !record.correctAnswer.trim() ||
    typeof record.explanation !== "string" || !record.explanation.trim() || record.explanation.trim().length > 5000) {
    throw new Error("EXERCISE_DRAFT_INVALID");
  }
  const options = record.options.map((option) => String(option).trim());
  if (new Set(options).size !== options.length || !options.includes(record.correctAnswer.trim())) {
    throw new Error("EXERCISE_DRAFT_INVALID");
  }
  return {
    title: record.title.trim(),
    description: record.description.trim(),
    codeSnippet: record.codeSnippet.trim(),
    options,
    correctAnswer: record.correctAnswer.trim(),
    explanation: record.explanation.trim(),
  };
}

export function validateGeneratedExerciseDraft(value: unknown): GeneratedExerciseDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("EXERCISE_DRAFT_INVALID");
  const record = value as Record<string, unknown>;
  if (!onlyKeys(record, ["title", "description", "exerciseType", "difficulty", "content"]) ||
    typeof record.exerciseType !== "string" || !TYPES.has(record.exerciseType as DbExerciseType) ||
    typeof record.difficulty !== "string" || !DIFFICULTIES.has(record.difficulty as DbDifficultyLevel)) {
    throw new Error("EXERCISE_DRAFT_INVALID");
  }
  const content = validateGeneratedExerciseContent(record.content);
  if (record.title !== content.title || record.description !== content.description) {
    throw new Error("EXERCISE_DRAFT_INVALID");
  }
  return {
    title: content.title,
    description: content.description,
    exerciseType: record.exerciseType as DbExerciseType,
    difficulty: record.difficulty as DbDifficultyLevel,
    content,
  };
}
