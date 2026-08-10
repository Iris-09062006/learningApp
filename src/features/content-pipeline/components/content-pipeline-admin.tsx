"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import type {
  ContentTarget,
  CourseDraftBatch,
  LessonDraftRecord,
  ReviewCourseDraftBatchResult,
} from "@/features/content-pipeline/types";

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface PendingGeneration {
  sourceDocumentId: number;
  sourceFilename: string;
}

interface GeneratedExerciseSummary {
  id: number;
  lessonId: number;
  title: string;
  status: string;
}

const CHECKPOINT_KEY = "learningapp.course-draft-generation";

export async function requestPipelineApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message ?? (response.status >= 500
      ? "Dịch vụ tạm thời quá tải hoặc hết thời gian chờ. Vui lòng thử lại."
      : "Yêu cầu không thành công."));
  }
  return payload.data;
}

async function requestExerciseApi(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null) as {
    generatedExercise?: GeneratedExerciseSummary;
    message?: string;
  } | null;
  if (!response.ok || !payload?.generatedExercise) {
    throw new Error(payload?.message ?? "Không thể sinh bài tập.");
  }
  return payload.generatedExercise;
}

function readCheckpoint(): PendingGeneration | null {
  try {
    const raw = sessionStorage.getItem(CHECKPOINT_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<PendingGeneration>;
    if (!Number.isSafeInteger(value.sourceDocumentId) || Number(value.sourceDocumentId) <= 0) return null;
    return {
      sourceDocumentId: Number(value.sourceDocumentId),
      sourceFilename: typeof value.sourceFilename === "string" ? value.sourceFilename : "Tài liệu đã tải",
    };
  } catch {
    return null;
  }
}

function storeCheckpoint(value: PendingGeneration | null) {
  if (value) sessionStorage.setItem(CHECKPOINT_KEY, JSON.stringify(value));
  else sessionStorage.removeItem(CHECKPOINT_KEY);
}

export function ContentPipelineAdmin() {
  const [batches, setBatches] = useState<CourseDraftBatch[]>([]);
  const [targets, setTargets] = useState<ContentTarget[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonDraftRecord | null>(null);
  const [pendingGeneration, setPendingGeneration] = useState<PendingGeneration | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [published, setPublished] = useState<ReviewCourseDraftBatchResult | null>(null);
  const [exerciseLessonId, setExerciseLessonId] = useState("");
  const [exerciseType, setExerciseType] = useState("predict_output");
  const [difficulty, setDifficulty] = useState("easy");
  const [learningObjective, setLearningObjective] = useState("");
  const [topicHint, setTopicHint] = useState("");
  const [generatedExercise, setGeneratedExercise] = useState<GeneratedExerciseSummary | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Đang tải dữ liệu...");
  const [error, setError] = useState<string | null>(null);

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.sourceDocumentId === selectedBatchId) ?? null,
    [batches, selectedBatchId]
  );
  const publishedTargets = useMemo(
    () => targets.filter((target) => target.isPublished),
    [targets]
  );

  const refresh = useCallback(async () => {
    const [batchData, targetData] = await Promise.all([
      requestPipelineApi<{ items: CourseDraftBatch[] }>("/api/admin/course-drafts"),
      requestPipelineApi<{ items: ContentTarget[] }>("/api/admin/content-targets"),
    ]);
    setBatches(batchData.items);
    setTargets(targetData.items);
    setSelectedBatchId((current) => {
      if (current && batchData.items.some((item) => item.sourceDocumentId === current)) return current;
      return batchData.items[0]?.sourceDocumentId ?? null;
    });
    const checkpoint = readCheckpoint();
    if (checkpoint && batchData.items.some((item) => item.sourceDocumentId === checkpoint.sourceDocumentId)) {
      storeCheckpoint(null);
      setPendingGeneration(null);
    } else {
      setPendingGeneration(checkpoint);
    }
    setMessage(batchData.items.length ? "Đã tải hàng chờ Course draft." : "Không có Course draft đang chờ duyệt.");
  }, []);

  useEffect(() => {
    refresh().catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : "Không thể tải dữ liệu.");
      setMessage("");
    });
  }, [refresh]);

  function checkpoint(value: PendingGeneration | null) {
    storeCheckpoint(value);
    setPendingGeneration(value);
  }

  async function runGeneration(value: PendingGeneration) {
    await requestPipelineApi(`/api/admin/content-sources/${value.sourceDocumentId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    checkpoint(null);
    await refresh();
  }

  async function submitSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setPublished(null);
    let canRetryGeneration = false;
    try {
      const form = event.currentTarget;
      const fileInput = form.elements.namedItem("source") as HTMLInputElement;
      const file = fileInput.files?.[0];
      if (!file) throw new Error("Hãy chọn một tệp PDF hoặc tài liệu được hỗ trợ.");
      const formData = new FormData();
      formData.set("file", file);
      setMessage("Đang tải tài liệu...");
      const source = await requestPipelineApi<{ id: number; originalFilename: string }>("/api/admin/content-sources", {
        method: "POST",
        body: formData,
      });
      const pending = { sourceDocumentId: source.id, sourceFilename: source.originalFilename };
      setMessage("Đang trích xuất nội dung...");
      await requestPipelineApi(`/api/admin/content-sources/${source.id}/extract`, { method: "POST" });
      checkpoint(pending);
      canRetryGeneration = true;
      setMessage("AI đang phân tích chủ đề và tạo Course cùng các Lesson...");
      await runGeneration(pending);
      form.reset();
      setMessage("Course draft đã được lưu và đưa vào hàng chờ duyệt.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Không thể xử lý tài liệu.");
      setMessage(canRetryGeneration
        ? "Có thể thử lại bước sinh Course mà không cần tải lại tệp."
        : "Tài liệu chưa được trích xuất; hãy kiểm tra tệp và thử tải lại.");
    } finally {
      setBusy(false);
    }
  }

  async function retryGeneration() {
    if (!pendingGeneration) return;
    setBusy(true);
    setError(null);
    setMessage("Đang thử sinh lại Course draft...");
    try {
      await runGeneration(pendingGeneration);
      setMessage("Course draft đã được tạo lại thành công.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Không thể thử lại.");
    } finally {
      setBusy(false);
    }
  }

  async function openLesson(id: number) {
    setBusy(true);
    setError(null);
    try {
      setSelectedLesson(await requestPipelineApi<LessonDraftRecord>(`/api/admin/lesson-drafts/${id}`));
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Không thể tải Lesson draft.");
    } finally {
      setBusy(false);
    }
  }

  function updateSection(index: number, field: "heading" | "bodyMarkdown", value: string) {
    setSelectedLesson((current) => current ? {
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section
      ),
    } : current);
  }

  async function saveLesson() {
    if (!selectedLesson) return;
    setBusy(true);
    setError(null);
    try {
      await requestPipelineApi(`/api/admin/lesson-drafts/${selectedLesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedLesson.title,
          summary: selectedLesson.summary,
          estimatedMinutes: selectedLesson.estimatedMinutes,
          sections: selectedLesson.sections,
        }),
      });
      await refresh();
      await openLesson(selectedLesson.id);
      setMessage("Đã lưu bản chỉnh sửa Lesson; citations được giữ nguyên.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu Lesson.");
    } finally {
      setBusy(false);
    }
  }

  async function reviewBatch(decision: "approved" | "rejected" | "needs_revision") {
    if (!selectedBatch) return;
    setBusy(true);
    setError(null);
    try {
      const result = await requestPipelineApi<ReviewCourseDraftBatchResult>(
        `/api/admin/course-drafts/${selectedBatch.sourceDocumentId}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision, comment: reviewComment }),
        }
      );
      setPublished(decision === "approved" ? result : null);
      setSelectedLesson(null);
      setReviewComment("");
      await refresh();
      setMessage(decision === "approved"
        ? "Đã duyệt và xuất bản Course cùng toàn bộ Lesson trong một giao dịch."
        : decision === "rejected"
          ? "Đã từ chối Course draft; quyết định đã được lưu."
          : "Đã chuyển Course draft sang trạng thái cần chỉnh sửa.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Không thể duyệt Course draft.");
    } finally {
      setBusy(false);
    }
  }

  async function generateExercise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setGeneratedExercise(null);
    try {
      const result = await requestExerciseApi(
        "/api/ai/exercises/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId: Number(exerciseLessonId),
            exerciseType,
            difficulty,
            learningObjective,
            topicHint: topicHint.trim() || undefined,
          }),
        }
      );
      setGeneratedExercise(result);
      setMessage("Bài tập đã được lưu đúng Lesson và đang chờ duyệt riêng.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Không thể sinh bài tập.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-labelledby="course-generation-title">
        <h2 id="course-generation-title" className="text-xl font-semibold text-slate-950">PDF → Course draft + nhiều Lesson</h2>
        <p className="mt-2 text-sm text-slate-600">AI chỉ tạo Course và Lesson có trích dẫn. Bài tập không được tạo trong bước này.</p>
        <form className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={submitSource}>
          <label className="flex-1 text-sm font-medium text-slate-800">
            Tài liệu nguồn
            <input className="mt-2 block w-full rounded-lg border border-slate-300 p-2" name="source" type="file" accept=".pdf,.txt,.md,.docx" disabled={busy} />
          </label>
          <button className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} type="submit">
            Tạo Course draft
          </button>
        </form>
        {pendingGeneration ? (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            Chưa hoàn tất: {pendingGeneration.sourceFilename}.{" "}
            <button className="font-semibold underline disabled:opacity-50" type="button" onClick={retryGeneration} disabled={busy}>Thử sinh lại</button>
          </div>
        ) : null}
      </section>

      <div aria-live="polite" className="text-sm text-slate-700">{message}</div>
      {error ? <div role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}
      {published ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          Course đã xuất bản. <Link className="font-semibold underline" href={`/courses/${published.courseId}`}>Mở Course</Link>
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,2fr)]" aria-labelledby="review-title">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 id="review-title" className="font-semibold text-slate-950">Course đang chờ duyệt</h2>
          {batches.length === 0 ? <p className="mt-3 text-sm text-slate-500">Hàng chờ trống.</p> : (
            <ul className="mt-3 space-y-2">
              {batches.map((batch) => (
                <li key={batch.sourceDocumentId}>
                  <button
                    className={`w-full rounded-lg border p-3 text-left text-sm ${selectedBatchId === batch.sourceDocumentId ? "border-blue-500 bg-blue-50" : "border-slate-200"}`}
                    type="button"
                    onClick={() => { setSelectedBatchId(batch.sourceDocumentId); setSelectedLesson(null); }}
                  >
                    <span className="block font-semibold text-slate-900">{batch.courseTitle}</span>
                    <span className="text-slate-600">{batch.lessons.length} Lesson · {batch.sourceFilename}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          {!selectedBatch ? <p className="text-sm text-slate-500">Chọn một Course draft để kiểm tra.</p> : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{selectedBatch.status}</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-950">{selectedBatch.courseTitle}</h3>
                <p className="mt-2 text-sm text-slate-700">{selectedBatch.courseDescription}</p>
              </div>
              <ol className="space-y-2">
                {selectedBatch.lessons.map((lesson, index) => (
                  <li key={lesson.id}>
                    <button className="w-full rounded-lg border border-slate-200 p-3 text-left hover:border-blue-400" type="button" onClick={() => openLesson(lesson.id)} disabled={busy}>
                      <span className="font-semibold text-slate-900">{index + 1}. {lesson.title}</span>
                      <span className="mt-1 block text-sm text-slate-600">{lesson.summary} · {lesson.estimatedMinutes} phút</span>
                    </button>
                  </li>
                ))}
              </ol>
              <label className="block text-sm font-medium text-slate-800">Ghi chú review
                <textarea className="mt-2 min-h-20 w-full rounded-lg border border-slate-300 p-2" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} />
              </label>
              <div className="flex flex-wrap gap-3">
                <button className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" type="button" onClick={() => reviewBatch("approved")} disabled={busy}>Duyệt & xuất bản Course</button>
                <button className="rounded-lg border border-amber-500 px-4 py-2 text-sm font-semibold text-amber-800 disabled:opacity-50" type="button" onClick={() => reviewBatch("needs_revision")} disabled={busy}>Cần chỉnh sửa</button>
                <button className="rounded-lg border border-red-500 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-50" type="button" onClick={() => reviewBatch("rejected")} disabled={busy}>Từ chối</button>
              </div>
            </div>
          )}
        </div>
      </section>

      {selectedLesson ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6" aria-labelledby="lesson-editor-title">
          <h2 id="lesson-editor-title" className="text-xl font-semibold text-slate-950">Nội dung Lesson draft</h2>
          <div className="mt-4 grid gap-4">
            <label className="text-sm font-medium">Tiêu đề<input className="mt-1 w-full rounded-lg border border-slate-300 p-2" value={selectedLesson.title} onChange={(event) => setSelectedLesson({ ...selectedLesson, title: event.target.value })} /></label>
            <label className="text-sm font-medium">Tóm tắt<textarea className="mt-1 w-full rounded-lg border border-slate-300 p-2" value={selectedLesson.summary} onChange={(event) => setSelectedLesson({ ...selectedLesson, summary: event.target.value })} /></label>
            {selectedLesson.sections.map((section, index) => (
              <fieldset className="rounded-lg border border-slate-200 p-4" key={`${selectedLesson.id}-${index}`}>
                <legend className="px-1 text-sm font-semibold">Phần {index + 1}</legend>
                <input aria-label={`Tiêu đề phần ${index + 1}`} className="mb-2 w-full rounded-lg border border-slate-300 p-2" value={section.heading} onChange={(event) => updateSection(index, "heading", event.target.value)} />
                <textarea aria-label={`Nội dung phần ${index + 1}`} className="min-h-36 w-full rounded-lg border border-slate-300 p-2 font-mono text-sm" value={section.bodyMarkdown} onChange={(event) => updateSection(index, "bodyMarkdown", event.target.value)} />
                <p className="mt-2 text-xs text-slate-500">Nguồn chunk: {section.citationChunkIndexes.join(", ")}</p>
              </fieldset>
            ))}
            <button className="w-fit rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" type="button" onClick={saveLesson} disabled={busy}>Lưu Lesson draft</button>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-violet-200 bg-violet-50 p-6" aria-labelledby="exercise-generation-title">
        <h2 id="exercise-generation-title" className="text-xl font-semibold text-slate-950">Tạo bài tập riêng cho từng Lesson</h2>
        <p className="mt-2 text-sm text-slate-700">Chọn đúng một Lesson đã xuất bản. AI dùng tiêu đề và nội dung hiện tại của Lesson; kết quả được lưu chờ duyệt bài tập, không tự xuất bản.</p>
        <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={generateExercise}>
          <label className="text-sm font-medium">Lesson
            <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" value={exerciseLessonId} onChange={(event) => setExerciseLessonId(event.target.value)} required>
              <option value="">Chọn Lesson</option>
              {publishedTargets.map((target) => <option key={target.lessonId} value={target.lessonId}>{target.courseTitle} · {target.lessonTitle}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">Loại bài tập
            <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" value={exerciseType} onChange={(event) => setExerciseType(event.target.value)}>
              <option value="predict_output">Predict the Output</option><option value="fix_the_bug">Fix the Bug</option>
            </select>
          </label>
          <label className="text-sm font-medium">Độ khó
            <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
              <option value="easy">Dễ</option><option value="medium">Trung bình</option><option value="hard">Khó</option>
            </select>
          </label>
          <label className="text-sm font-medium">Mục tiêu học tập
            <input className="mt-1 w-full rounded-lg border border-slate-300 p-2" value={learningObjective} onChange={(event) => setLearningObjective(event.target.value)} required />
          </label>
          <label className="text-sm font-medium md:col-span-2">Gợi ý chủ đề (không bắt buộc)
            <input className="mt-1 w-full rounded-lg border border-slate-300 p-2" value={topicHint} onChange={(event) => setTopicHint(event.target.value)} />
          </label>
          <button className="w-fit rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50" type="submit" disabled={busy || !exerciseLessonId}>Sinh bài tập cho Lesson này</button>
        </form>
        {generatedExercise ? <p className="mt-4 text-sm text-violet-950">Đã tạo “{generatedExercise.title}” cho Lesson #{generatedExercise.lessonId}. <Link className="font-semibold underline" href={`/moderation/${generatedExercise.id}`}>Mở hàng duyệt bài tập</Link></p> : null}
      </section>
    </div>
  );
}
