"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  DbDifficultyLevel,
  DbExerciseType,
  ExerciseGenerationContext,
  GeneratedExerciseRecord,
} from "@/features/ai/types";

export function ExerciseGenerationForm({ context }: { context: ExerciseGenerationContext }) {
  const [exerciseType, setExerciseType] = useState<DbExerciseType>("predict_output");
  const [difficulty, setDifficulty] = useState<DbDifficultyLevel>("easy");
  const [learningObjective, setLearningObjective] = useState(context.learningObjectives[0] ?? "");
  const [topicHint, setTopicHint] = useState("");
  const [result, setResult] = useState<GeneratedExerciseRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/ai/exercises/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: context.lessonId,
          exerciseType,
          difficulty,
          learningObjective: learningObjective.trim(),
          topicHint: topicHint.trim() || undefined,
        }),
      });
      const body = await response.json();
      if (!response.ok || !body.generatedExercise) {
        throw new Error(body.message || "Không thể sinh bài tập.");
      }
      setResult(body.generatedExercise);
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : "Không thể sinh bài tập.");
    } finally {
      setLoading(false);
    }
  }

  const fieldClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm";
  return (
    <div className="space-y-6">
      <div>
        <Link href="/moderation/lessons" className="text-sm font-medium text-indigo-700">← Chọn Lesson khác</Link>
        <h1 className="mt-3 text-2xl font-bold text-slate-950">Tạo Exercise cho {context.lessonTitle}</h1>
        <p className="mt-1 text-sm text-slate-600">Course: {context.courseTitle}. AI chỉ dùng nội dung và mục tiêu của Lesson đã publish này.</p>
      </div>
      {context.learningObjectives.length > 0 && (
        <aside className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          <strong>Mục tiêu chính thức:</strong>
          <ul className="mt-2 list-disc space-y-1 pl-5">{context.learningObjectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
        </aside>
      )}
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {result && <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">Draft “{result.title}” đang chờ moderation. <Link className="font-semibold underline" href={`/moderation/${result.id}`}>Mở draft</Link></p>}
      <form onSubmit={submit} className="grid gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-2">
        <label className="text-sm font-medium">Loại bài tập<select value={exerciseType} onChange={(event) => setExerciseType(event.target.value as DbExerciseType)} className={fieldClass}><option value="predict_output">Predict the Output</option><option value="fix_the_bug">Fix the Bug</option></select></label>
        <label className="text-sm font-medium">Độ khó<select value={difficulty} onChange={(event) => setDifficulty(event.target.value as DbDifficultyLevel)} className={fieldClass}><option value="easy">Dễ</option><option value="medium">Trung bình</option><option value="hard">Khó</option></select></label>
        <label className="text-sm font-medium md:col-span-2">Mục tiêu học tập<input list="lesson-objectives" maxLength={500} required value={learningObjective} onChange={(event) => setLearningObjective(event.target.value)} className={fieldClass} /><datalist id="lesson-objectives">{context.learningObjectives.map((objective) => <option value={objective} key={objective} />)}</datalist></label>
        <label className="text-sm font-medium md:col-span-2">Gợi ý chủ đề (không bắt buộc)<input maxLength={500} value={topicHint} onChange={(event) => setTopicHint(event.target.value)} className={fieldClass} /></label>
        <button type="submit" disabled={loading || !learningObjective.trim()} className="w-fit rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Đang sinh..." : "Sinh Exercise draft"}</button>
      </form>
    </div>
  );
}
