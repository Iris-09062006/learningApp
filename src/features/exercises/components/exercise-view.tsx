"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import type {
  GetExerciseResponse,
  SubmitExerciseResponse,
} from "@/features/exercises/types";

interface ExerciseViewProps {
  exercise: GetExerciseResponse;
}

interface SubmitEnvelope {
  success: boolean;
  data?: SubmitExerciseResponse;
  error?: { message?: string; code?: string };
}

export const ExerciseView: React.FC<ExerciseViewProps> = ({ exercise }) => {
  const router = useRouter();
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitExerciseResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(): Promise<void> {
    if (isSubmitting || selectedOptionId === null) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const response = await fetch(`/api/exercises/${exercise.id}/submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: { selectedOptionId },
        }),
      });

      const payload = (await response.json()) as SubmitEnvelope;

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || "Không thể nộp bài tập.");
      }

      if (!payload.data) {
        throw new Error("Phản hồi không hợp lệ.");
      }

      setResult(payload.data);
      router.refresh();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể nộp bài tập."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div data-testid="exercise-view" className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            Bài tập {exercise.order}
          </span>
          <span className="text-xs capitalize text-slate-500 dark:text-slate-400">
            {exercise.type} &bull; {exercise.difficulty}
          </span>
        </div>

        <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
          {exercise.title}
        </h1>

        {exercise.description && (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {exercise.description}
          </p>
        )}

        {exercise.codeSnippet && (
          <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
            <code>{exercise.codeSnippet}</code>
          </pre>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Chọn đáp án
        </h2>

        <div className="mt-4 space-y-3">
          {exercise.options.map((option) => {
            const isSelected = selectedOptionId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedOptionId(option.id)}
                aria-pressed={isSelected}
                className={[
                  "flex w-full items-center justify-between rounded-lg border p-4 text-left transition",
                  isSelected
                    ? "border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950"
                    : "border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700",
                ].join(" ")}
              >
                <span className="text-sm text-slate-700 dark:text-slate-200">
                  {option.content}
                </span>
                <span
                  className={[
                    "ml-3 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    isSelected
                      ? "border-indigo-600 bg-indigo-600"
                      : "border-slate-300 dark:border-slate-600",
                  ].join(" ")}
                >
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col items-start gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedOptionId === null}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Đang nộp..."
              : result
                ? "Nộp lại"
                : "Nộp bài"}
          </button>

          {errorMessage && (
            <p role="alert" className="max-w-md text-xs text-red-600">
              {errorMessage}
            </p>
          )}

          {result && (
            <div
              role="status"
              className={[
                "w-full rounded-lg border p-4 text-sm",
                result.isCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                  : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200",
              ].join(" ")}
            >
              <p className="font-semibold">
                {result.isCorrect ? "Chính xác!" : "Chưa chính xác"}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{result.feedback}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};