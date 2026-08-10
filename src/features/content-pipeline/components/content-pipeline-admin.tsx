"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ContentTarget,
  LessonDraftRecord,
  PublishLessonDraftResult,
  StructuredLessonDraft,
} from "@/features/content-pipeline/types";
import { documentTitleFromFilename } from "@/features/content-pipeline/utils/document-title";

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { message?: string };
}

export async function requestPipelineApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body instanceof FormData
      ? init.headers
      : { "Content-Type": "application/json", ...init?.headers },
  });
  const raw = await response.text();
  let payload: ApiEnvelope<T> | null = null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      payload = parsed as ApiEnvelope<T>;
    }
  } catch {
    // Gateways can return HTML timeout pages. Do not leak parser internals to users.
  }
  if (!payload) {
    throw new Error(
      [502, 503, 504].includes(response.status)
        ? "Dịch vụ tạm thời quá tải hoặc hết thời gian chờ. Vui lòng thử lại."
        : "Máy chủ trả về dữ liệu không hợp lệ. Vui lòng thử lại.",
    );
  }
  if (!response.ok || !payload.success || payload.data === undefined) {
    throw new Error(payload.error?.message ?? "Yêu cầu không thành công.");
  }
  return payload.data;
}

const statusLabel: Record<LessonDraftRecord["status"], string> = {
  pending_review: "Chờ duyệt",
  needs_revision: "Cần chỉnh sửa",
  rejected: "Đã từ chối",
  approved: "Đã duyệt",
  published: "Đã xuất bản",
};

const PENDING_GENERATION_KEY = "learningapp:pending-lesson-draft-generation";

interface PendingGeneration {
  sourceDocumentId: number;
  targetLessonId: number;
}

function readPendingGeneration(): PendingGeneration | null {
  try {
    const raw = sessionStorage.getItem(PENDING_GENERATION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const record = parsed as Record<string, unknown>;
    if (!Number.isSafeInteger(record.sourceDocumentId) || Number(record.sourceDocumentId) <= 0
      || !Number.isSafeInteger(record.targetLessonId) || Number(record.targetLessonId) <= 0) return null;
    return {
      sourceDocumentId: Number(record.sourceDocumentId),
      targetLessonId: Number(record.targetLessonId),
    };
  } catch {
    return null;
  }
}

function persistPendingGeneration(value: PendingGeneration | null) {
  if (value) sessionStorage.setItem(PENDING_GENERATION_KEY, JSON.stringify(value));
  else sessionStorage.removeItem(PENDING_GENERATION_KEY);
}

export function ContentPipelineAdmin() {
  const [targets, setTargets] = useState<ContentTarget[]>([]);
  const [drafts, setDrafts] = useState<LessonDraftRecord[]>([]);
  const [selected, setSelected] = useState<LessonDraftRecord | null>(null);
  const [targetMode, setTargetMode] = useState<"existing" | "new">("new");
  const [targetLessonId, setTargetLessonId] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [sourceFilename, setSourceFilename] = useState("");
  const [pendingGeneration, setPendingGeneration] = useState<PendingGeneration | null>(null);
  const [publishedDestination, setPublishedDestination] = useState<PublishLessonDraftResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Đang tải dữ liệu...");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [targetData, draftData] = await Promise.all([
        requestPipelineApi<{ items: ContentTarget[] }>("/api/admin/content-targets"),
        requestPipelineApi<{ items: LessonDraftRecord[] }>("/api/admin/lesson-drafts"),
      ]);
      setTargets(targetData.items);
      setDrafts(draftData.items);
      setTargetLessonId((current) => targetData.items.some((target) => String(target.lessonId) === current)
        ? current
        : String(targetData.items[0]?.lessonId ?? ""));
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Không thể tải pipeline.");
    } finally {
      setMessage("");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => { setPendingGeneration(readPendingGeneration()); }, []);
  useEffect(() => {
    if (pendingGeneration && drafts.some((draft) =>
      draft.sourceDocumentId === pendingGeneration.sourceDocumentId
      && draft.targetLessonId === pendingGeneration.targetLessonId)) {
      persistPendingGeneration(null);
      setPendingGeneration(null);
    }
  }, [drafts, pendingGeneration]);

  function checkpointGeneration(value: PendingGeneration | null) {
    persistPendingGeneration(value);
    setPendingGeneration(value);
  }

  async function generateDraft(checkpoint: PendingGeneration) {
    setMessage("9Router đang tạo lesson draft có citation...");
    const generated = await requestPipelineApi<{ lessonDraftId: number }>(
      `/api/admin/content-sources/${checkpoint.sourceDocumentId}/generate`,
      { method: "POST", body: JSON.stringify({ targetLessonId: checkpoint.targetLessonId }) },
    );
    checkpointGeneration(null);
    await refresh();
    await openDraft(generated.lessonDraftId);
    setMessage("Draft đã xuất hiện trong hàng chờ kiểm duyệt.");
  }

  async function submitSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (targetMode === "existing" && !targetLessonId) {
      setError("Hãy chọn bài học hiện có.");
      return;
    }
    if (targetMode === "new" && !newCourseTitle.trim()) {
      setError("Hãy nhập tên course mới.");
      return;
    }
    setBusy(true);
    setError(null);
    setMessage("Đang tải tài liệu lên vùng lưu trữ riêng tư...");
    try {
      const source = await requestPipelineApi<{ id: number }>("/api/admin/content-sources", { method: "POST", body: formData });
      setMessage("Đang trích xuất và chia đoạn nguồn...");
      await requestPipelineApi(`/api/admin/content-sources/${source.id}/extract`, { method: "POST" });

      let resolvedTargetLessonId = Number(targetLessonId);
      if (targetMode === "new") {
        setMessage("Đang tạo course mới và chapter từ tên tài liệu...");
        const target = await requestPipelineApi<{ lessonId: number }>("/api/admin/content-curriculum", {
          method: "POST",
          body: JSON.stringify({ mode: "new", courseTitle: newCourseTitle.trim(), sourceDocumentId: source.id }),
        });
        resolvedTargetLessonId = target.lessonId;
      }

      const checkpoint = { sourceDocumentId: source.id, targetLessonId: resolvedTargetLessonId };
      checkpointGeneration(checkpoint);
      await generateDraft(checkpoint);
      form.reset();
      setSourceFilename("");
      if (targetMode === "new") setNewCourseTitle("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pipeline không thể hoàn tất.");
      setMessage("");
    } finally {
      setBusy(false);
    }
  }

  async function retryGeneration() {
    if (!pendingGeneration) return;
    setBusy(true);
    setError(null);
    try {
      await generateDraft(pendingGeneration);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Không thể tạo lại draft.");
      setMessage("");
    } finally {
      setBusy(false);
    }
  }

  async function openDraft(id: number) {
    setBusy(true);
    setError(null);
    try {
      setPublishedDestination(null);
      setSelected(await requestPipelineApi<LessonDraftRecord>(`/api/admin/lesson-drafts/${id}`));
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Không thể tải draft.");
    } finally {
      setBusy(false);
    }
  }

  function updateSection(index: number, field: "heading" | "bodyMarkdown", value: string) {
    setSelected((current) => current ? {
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, [field]: value } : section),
    } : current);
  }

  async function saveDraft() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const body: StructuredLessonDraft = {
      title: selected.title,
      summary: selected.summary,
      estimatedMinutes: selected.estimatedMinutes,
      sections: selected.sections,
    };
    try {
      await requestPipelineApi(`/api/admin/lesson-drafts/${selected.id}`, { method: "PATCH", body: JSON.stringify(body) });
      await openDraft(selected.id);
      await refresh();
      setMessage("Đã lưu revision mới; draft cần được duyệt lại.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Không thể lưu draft.");
      setBusy(false);
    }
  }

  async function review(decision: "approved" | "rejected" | "needs_revision") {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await requestPipelineApi(`/api/admin/lesson-drafts/${selected.id}/reviews`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      });
      await openDraft(selected.id);
      await refresh();
      setMessage(`Đã cập nhật: ${decision}.`);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Không thể ghi review.");
      setBusy(false);
    }
  }

  async function publish() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const result = await requestPipelineApi<PublishLessonDraftResult>(
        `/api/admin/lesson-drafts/${selected.id}/publish`,
        { method: "POST" },
      );
      await openDraft(selected.id);
      await refresh();
      setPublishedDestination(result);
      setMessage(result.coursePublished
        ? "Đã publish lesson và course ra catalog."
        : "Đã publish lesson; course vẫn ẩn cho đến khi mọi nội dung hoàn tất.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Không thể publish draft.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">AI Content Operations</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">Document-to-Lesson</h1>
        <p className="mt-2 max-w-3xl text-slate-600">Tải nguồn riêng tư, trích xuất, tạo draft có citation và chỉ publish sau khi Admin duyệt.</p>
      </header>

      <div aria-live="polite" aria-atomic="true" className="min-h-6 text-sm text-slate-600">{message}</div>
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

      {pendingGeneration ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <span>Đích bài học đã được tạo/chọn nhưng draft chưa hoàn tất. Hãy thử lại mà không upload hay tạo curriculum lần nữa.</span>
          <Button type="button" onClick={() => void retryGeneration()} isLoading={busy} disabled={busy}>
            Thử tạo lại draft
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>1. Tạo draft từ tài liệu</CardTitle>
          <CardDescription>PDF có text layer, DOCX, TXT hoặc Markdown; tối đa 10 MiB.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitSource} className="space-y-4">
            <div>
              <label htmlFor="source-file" className="mb-1 block text-sm font-medium">Tài liệu nguồn</label>
              <input id="source-file" name="file" type="file" required onChange={(event) => setSourceFilename(event.target.files?.[0]?.name ?? "")} accept=".pdf,.docx,.txt,.md,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="block w-full rounded-lg border border-slate-300 p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
            </div>
            <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-semibold">Nơi tạo nội dung</legend>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="target-mode" checked={targetMode === "new"} onChange={() => setTargetMode("new")} />Tạo course mới</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="target-mode" checked={targetMode === "existing"} onChange={() => setTargetMode("existing")} />Thêm vào course hiện có</label>
              </div>
              {targetMode === "existing" && !targets.length ? (
                <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  Chưa có bài học nào để gắn draft. Hãy chọn “Tạo course mới”.
                </div>
              ) : null}
              {targetMode === "new" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label htmlFor="new-course-title" className="mb-1 block text-sm font-medium">Tên course mới</label>
                    <input id="new-course-title" value={newCourseTitle} onChange={(event) => setNewCourseTitle(event.target.value)} maxLength={150} required className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                  </div>
                  <p className="self-end rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Chapter tự động: <strong>{sourceFilename ? documentTitleFromFilename(sourceFilename) : "chọn tài liệu ở trên"}</strong></p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label htmlFor="target-lesson" className="mb-1 block text-sm font-medium">Bài học hiện có</label>
                    <select id="target-lesson" value={targetLessonId} onChange={(event) => setTargetLessonId(event.target.value)} required className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                      <option value="">Chọn bài học</option>
                      {targets.map((target) => <option key={target.lessonId} value={target.lessonId}>{target.courseTitle} / {target.chapterTitle} / {target.lessonTitle}</option>)}
                    </select>
                  </div>
                  <p className="self-end rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">Draft sẽ cập nhật đúng bài học đã chọn; không tạo thêm course, chapter hay lesson.</p>
                </div>
              )}
            </fieldset>
            <Button type="submit" isLoading={busy} disabled={busy || !sourceFilename || (targetMode === "new" ? !newCourseTitle.trim() : !targetLessonId)}>Upload & tạo draft</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]">
        <Card>
          <CardHeader><CardTitle>2. Hàng chờ kiểm duyệt</CardTitle><CardDescription>{drafts.length} draft gần nhất</CardDescription></CardHeader>
          <CardContent>
            <ul className="space-y-2">{drafts.map((draft) => <li key={draft.id}><button type="button" onClick={() => void openDraft(draft.id)} className="w-full rounded-xl border border-slate-200 p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><span className="block font-medium text-slate-900">{draft.title}</span><span className="mt-1 block text-xs text-slate-500">Revision {draft.revision} · {statusLabel[draft.status]}</span></button></li>)}</ul>
            {!drafts.length ? <p className="text-sm text-slate-500">Chưa có draft.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>3. Chỉnh sửa, duyệt và publish</CardTitle><CardDescription>Mọi thay đổi tạo revision mới và xóa trạng thái approve cũ.</CardDescription></CardHeader>
          <CardContent>{selected ? <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_140px]"><div><label htmlFor="draft-title" className="mb-1 block text-sm font-medium">Tiêu đề</label><input id="draft-title" value={selected.title} onChange={(event) => setSelected({ ...selected, title: event.target.value })} className="h-10 w-full rounded-lg border border-slate-300 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" /></div><div><label htmlFor="draft-minutes" className="mb-1 block text-sm font-medium">Số phút</label><input id="draft-minutes" type="number" min="1" max="180" value={selected.estimatedMinutes} onChange={(event) => setSelected({ ...selected, estimatedMinutes: Number(event.target.value) })} className="h-10 w-full rounded-lg border border-slate-300 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" /></div></div>
            <div><label htmlFor="draft-summary" className="mb-1 block text-sm font-medium">Tóm tắt</label><textarea id="draft-summary" value={selected.summary} onChange={(event) => setSelected({ ...selected, summary: event.target.value })} rows={3} className="w-full rounded-lg border border-slate-300 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" /></div>
            {selected.sections.map((section, index) => <fieldset key={index} className="rounded-xl border border-slate-200 p-4"><legend className="px-2 text-sm font-semibold">Phần {index + 1}</legend><label htmlFor={`heading-${index}`} className="mb-1 block text-sm font-medium">Tiêu đề phần</label><input id={`heading-${index}`} value={section.heading} onChange={(event) => updateSection(index, "heading", event.target.value)} className="h-10 w-full rounded-lg border border-slate-300 px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" /><label htmlFor={`body-${index}`} className="mb-1 mt-3 block text-sm font-medium">Nội dung Markdown</label><textarea id={`body-${index}`} value={section.bodyMarkdown} onChange={(event) => updateSection(index, "bodyMarkdown", event.target.value)} rows={8} className="w-full rounded-lg border border-slate-300 p-3 font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" /><div className="mt-3 space-y-2">{selected.citations?.filter((citation) => citation.sectionIndex === index).map((citation) => <blockquote key={`${citation.sectionIndex}-${citation.chunkIndex}`} className="rounded-lg border-l-4 border-cyan-500 bg-cyan-50 p-3 text-sm text-slate-700"><span className="mb-1 block font-semibold text-cyan-800">Nguồn #{citation.chunkIndex}</span>{citation.quote}</blockquote>)}</div></fieldset>)}
            <div className="flex flex-wrap gap-2"><Button onClick={() => void saveDraft()} isLoading={busy} variant="outline">Lưu revision</Button><Button onClick={() => void review("needs_revision")} disabled={busy} variant="secondary">Yêu cầu chỉnh sửa</Button><Button onClick={() => void review("rejected")} disabled={busy} variant="danger">Từ chối</Button><Button onClick={() => void review("approved")} disabled={busy}>Duyệt</Button><Button type="button" onClick={() => void publish()} disabled={busy || selected.status !== "approved"} className="bg-emerald-600 hover:bg-emerald-700">Xuất bản bài học (transaction)</Button></div>
            {publishedDestination?.coursePublished ? (
              <div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-950">
                <p className="font-semibold">Bài học đã hiển thị cho người học.</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link href={`/courses/${publishedDestination.courseId}`} className="font-semibold text-emerald-800 underline">Mở khóa học</Link>
                  <Link href={`/courses/${publishedDestination.courseId}/roadmap`} className="font-semibold text-emerald-800 underline">Mở lộ trình</Link>
                  <Link href={`/lessons/${publishedDestination.lessonId}`} className="font-semibold text-emerald-800 underline">Mở bài học</Link>
                </div>
              </div>
            ) : null}
          </div> : <p className="text-sm text-slate-500">Chọn một draft trong hàng chờ để kiểm duyệt.</p>}</CardContent>
        </Card>
      </div>
    </div>
  );
}
