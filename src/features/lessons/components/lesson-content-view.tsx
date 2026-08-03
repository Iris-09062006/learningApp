"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import type { LessonResponse } from "@/features/lessons/types";

interface LessonContentViewProps {
  lesson: LessonResponse;
}

export const LessonContentView: React.FC<LessonContentViewProps> = ({ lesson }) => {
  const router = useRouter();
  const [isStarting, setIsStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleStartLesson(): Promise<void> {
    if (isStarting) return;

    setIsStarting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/lessons/${lesson.id}/start`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || "Không thể bắt đầu bài học.");
      }

      router.refresh();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error ? error.message : "Không thể bắt đầu bài học."
      );
    } finally {
      setIsStarting(false);
    }
  }

  const statusLabel = (() => {
    if (lesson.status === "completed") return "Hoàn thành";
    if (lesson.status === "inProgress") return "Đang học";
    return "Chưa bắt đầu";
  })();

  return (
    <div data-testid="lesson-content-view" className="space-y-8">
      {/* Header section */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="rounded bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              Bài {lesson.order}
            </span>
            <span className="text-xs text-slate-500 capitalize dark:text-slate-400">
              {statusLabel}
            </span>
          </div>

          {lesson.estimatedMinutes !== null && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ~{lesson.estimatedMinutes} phút
            </span>
          )}
        </div>

        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
          {lesson.title}
        </h1>

        <div className="mt-6 flex flex-col items-start gap-3 border-t border-slate-100 pt-6 dark:border-slate-800">
          <button
            type="button"
            onClick={handleStartLesson}
            disabled={isStarting}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isStarting
              ? "Đang xử lý..."
              : lesson.status === "completed"
                ? "Ôn tập bài học"
                : "Bắt đầu bài học"}
          </button>
          {errorMessage && (
            <p role="alert" className="max-w-md text-xs text-red-600">
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      {/* Lesson content */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Nội dung bài học
        </h2>

        {lesson.content ? (
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700 dark:text-slate-300">
              {lesson.content}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nội dung bài học đang được cập nhật.
          </p>
        )}
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Bài tập
        </h2>

        {lesson.exercises.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Chưa có bài tập cho bài học này.
          </p>
        ) : (
          <div className="space-y-3">
            {lesson.exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {exercise.order}. {exercise.title}
                  </h3>
                  <p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">
                    {exercise.type} &bull; {exercise.difficulty}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};