"use client";

import { useState } from "react";
import type {
  DbDifficultyLevel,
  DbExerciseType,
  GeneratedExerciseContent,
} from "@/features/ai/types";
import type { ReviewStatus, SubmitReviewInput } from "../types";

interface ModerationReviewFormProps {
  exerciseId: number;
  initialTitle: string;
  initialDescription: string;
  initialExerciseType: DbExerciseType;
  initialDifficulty: DbDifficultyLevel;
  initialContent: GeneratedExerciseContent;
  onSuccess: () => void;
}

const decisionOptions: Array<{ value: ReviewStatus; label: string }> = [
  { value: "approved", label: "Duyệt" },
  { value: "needs_revision", label: "Cần chỉnh sửa" },
  { value: "rejected", label: "Từ chối" },
];

export function ModerationReviewForm(props: ModerationReviewFormProps) {
  const [status, setStatus] = useState<ReviewStatus>("approved");
  const [feedback, setFeedback] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(props.initialTitle);
  const [description, setDescription] = useState(props.initialDescription);
  const [exerciseType, setExerciseType] = useState(props.initialExerciseType);
  const [difficulty, setDifficulty] = useState(props.initialDifficulty);
  const [codeSnippet, setCodeSnippet] = useState(props.initialContent.codeSnippet);
  const [optionsText, setOptionsText] = useState(props.initialContent.options.join("\n"));
  const [correctAnswer, setCorrectAnswer] = useState(props.initialContent.correctAnswer);
  const [explanation, setExplanation] = useState(props.initialContent.explanation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload: SubmitReviewInput = {
        generatedExerciseId: props.exerciseId,
        status,
        feedback: feedback.trim() || undefined,
        ...(isEditing ? {
          editedDraft: {
            title: title.trim(),
            description: description.trim(),
            exerciseType,
            difficulty,
            content: {
              title: title.trim(),
              description: description.trim(),
              codeSnippet,
              options: optionsText.split("\n").map((option) => option.trim()).filter(Boolean),
              correctAnswer: correctAnswer.trim(),
              explanation: explanation.trim(),
            },
          },
        } : {}),
      };

      const response = await fetch(`/api/moderation/generated-exercises/${props.exerciseId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: payload.status,
          comment: payload.feedback,
          editedDraft: payload.editedDraft,
        }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Không thể gửi đánh giá");
      }
      props.onSuccess();
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "mt-1 w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h2 className="text-lg font-bold">Kiểm duyệt bài tập</h2>
        <p className="mt-1 text-sm text-slate-500">Có thể chỉnh toàn bộ draft trước khi đưa ra quyết định.</p>
      </div>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Quyết định</legend>
        <div className="flex flex-wrap gap-4">
          {decisionOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input type="radio" name="status" checked={status === option.value} onChange={() => setStatus(option.value)} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-medium">Phản hồi
        <textarea maxLength={2000} rows={3} value={feedback} onChange={(event) => setFeedback(event.target.value)} className={inputClass} />
      </label>
      <button type="button" onClick={() => setIsEditing((value) => !value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium">
        {isEditing ? "Hủy chỉnh sửa" : "Chỉnh sửa draft"}
      </button>
      {isEditing && (
        <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
          <label className="block text-sm font-medium">Tiêu đề<input maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} /></label>
          <label className="block text-sm font-medium">Mô tả<textarea maxLength={2000} rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className={inputClass} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">Loại bài tập<select value={exerciseType} onChange={(event) => setExerciseType(event.target.value as DbExerciseType)} className={inputClass}><option value="predict_output">Predict output</option><option value="fix_the_bug">Fix the bug</option></select></label>
            <label className="block text-sm font-medium">Độ khó<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as DbDifficultyLevel)} className={inputClass}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
          </div>
          <label className="block text-sm font-medium">Code snippet<textarea maxLength={10000} rows={7} value={codeSnippet} onChange={(event) => setCodeSnippet(event.target.value)} className={`${inputClass} font-mono`} /></label>
          <label className="block text-sm font-medium">Các lựa chọn (mỗi dòng một lựa chọn)<textarea rows={5} value={optionsText} onChange={(event) => setOptionsText(event.target.value)} className={inputClass} /></label>
          <label className="block text-sm font-medium">Đáp án đúng<input value={correctAnswer} onChange={(event) => setCorrectAnswer(event.target.value)} className={inputClass} /></label>
          <label className="block text-sm font-medium">Giải thích<textarea maxLength={5000} rows={4} value={explanation} onChange={(event) => setExplanation(event.target.value)} className={inputClass} /></label>
        </div>
      )}
      <div className="flex justify-end border-t border-slate-200 pt-4">
        <button type="submit" disabled={loading} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{loading ? "Đang gửi..." : "Gửi đánh giá"}</button>
      </div>
    </form>
  );
}
