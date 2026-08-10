"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ContentChapterTarget,
  ContentTarget,
  LessonDraftRecord,
  StructuredLessonDraft,
} from "@/features/content-pipeline/types";

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

export function ContentPipelineAdmin() {
  const [targets, setTargets] = useState<ContentTarget[]>([]);
  const [chapters, setChapters] = useState<ContentChapterTarget[]>([]);
  const [drafts, setDrafts] = useState<LessonDraftRecord[]>([]);
  const [selected, setSelected] = useState<LessonDraftRecord | null>(null);
  const [targetMode, setTargetMode] = useState<"existing" | "new">("new");
  const [targetLessonId, setTargetLessonId] = useState("");
  const [newChapterId, setNewChapterId] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Đang tải dữ liệu...");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [targetData, draftData] = await Promise.all([
        requestPipelineApi<{ items: ContentTarget[]; chapters: ContentChapterTarget[] }>("/api/admin/content-targets"),
        requestPipelineApi<{ items: LessonDraftRecord[] }>("/api/admin/lesson-drafts"),
      ]);
      setTargets(targetData.items);
      setChapters(targetData.chapters);
      setDrafts(draftData.items);
      setTargetLessonId((current) => current || String(targetData.items[0]?.lessonId ?? ""));
      setNewChapterId((current) => current || String(targetData.chapters[0]?.chapterId ?? ""));
      setError(null);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Không thể tải pipeline.");
    } finally {
      setMessage("");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function submitSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (targetMode === "existing" && !targetLessonId) {
      setError("Hãy chọn bài học đích.");
      return;
    }
    if (targetMode === "new" && (!newChapterId || !newLessonTitle.trim())) {
      setError("Hãy chọn chapter và nhập tên bài học mới.");
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
        setMessage("Đang tạo bài học đích mới...");
        const target = await requestPipelineApi<ContentTarget>("/api/admin/content-targets", {
          method: "POST",
          body: JSON.stringify({ chapterId: Number(newChapterId), title: newLessonTitle.trim() }),
        });
        resolvedTargetLessonId = target.lessonId;
        setTargetLessonId(String(target.lessonId));
        setNewLessonTitle("");
      }

      setMessage("9Router đang tạo lesson draft có citation...");
      const generated = await requestPipelineApi<{ lessonDraftId: number }>(
        `/api/admin/content-sources/${source.id}/generate`,
        { method: "POST", body: JSON.stringify({ targetLessonId: resolvedTargetLessonId }) },
      );
      form.reset();
      await refresh();
      await openDraft(generated.lessonDraftId);
      setMessage("Draft đã sẵn sàng để kiểm duyệt.");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Pipeline không thể hoàn tất.");
      setMessage("");
    } finally {
      setBusy(false);
    }
  }

  async function openDraft(id: number) {
    setBusy(true);
    setError(null);
    try {
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
      const result = await requestPipelineApi<{ coursePublished: boolean }>(
        `/api/admin/lesson-drafts/${selected.id}/publish`,
        { method: "POST" },
      );
      await openDraft(selected.id);
      await refresh();
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

      <Card>
        <CardHeader>
          <CardTitle>1. Tạo draft từ tài liệu</CardTitle>
          <CardDescription>PDF có text layer, DOCX, TXT hoặc Markdown; tối đa 10 MiB.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitSource} className="space-y-4">
            <div>
              <label htmlFor="source-file" className="mb-1 block text-sm font-medium">Tài liệu nguồn</label>
              <input id="source-file" name="file" type="file" required accept=".pdf,.docx,.txt,.md,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="block w-full rounded-lg border border-slate-300 p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
            </div>
            <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4">
              <legend className="px-2 text-sm font-semibold">Bài học đích</legend>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="target-mode" checked={targetMode === "new"} onChange={() => setTargetMode("new")} />Tạo bài học mới</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="target-mode" checked={targetMode === "existing"} onChange={() => setTargetMode("existing")} />Dùng bài học hiện có</label>
              </div>
              {targetMode === "new" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label htmlFor="target-chapter" className="mb-1 block text-sm font-medium">Course / chapter</label>
                    <select id="target-chapter" value={newChapterId} onChange={(event) => setNewChapterId(event.target.value)} required className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                      <option value="">Chọn chapter</option>
                      {chapters.map((chapter) => <option key={chapter.chapterId} value={chapter.chapterId}>{chapter.courseTitle} / {chapter.chapterTitle}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="new-lesson-title" className="mb-1 block text-sm font-medium">Tên bài học mới</label>
                    <input id="new-lesson-title" value={newLessonTitle} onChange={(event) => setNewLessonTitle(event.target.value)} maxLength={150} required className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="target-lesson" className="mb-1 block text-sm font-medium">Bài học hiện có</label>
                  <select id="target-lesson" value={targetLessonId} onChange={(event) => setTargetLessonId(event.target.value)} required className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                    <option value="">Chọn bài học</option>
                    {targets.map((target) => <option key={target.lessonId} value={target.lessonId}>{target.courseTitle} / {target.chapterTitle} / {target.lessonTitle}</option>)}
                  </select>
                </div>
              )}
            </fieldset>
            <Button type="submit" isLoading={busy}>Upload & tạo draft</Button>
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
            <div className="flex flex-wrap gap-2"><Button onClick={() => void saveDraft()} isLoading={busy} variant="outline">Lưu revision</Button><Button onClick={() => void review("needs_revision")} disabled={busy} variant="secondary">Yêu cầu chỉnh sửa</Button><Button onClick={() => void review("rejected")} disabled={busy} variant="danger">Từ chối</Button><Button onClick={() => void review("approved")} disabled={busy}>Duyệt</Button><Button onClick={() => void publish()} disabled={busy || selected.status !== "approved"} className="bg-emerald-600 hover:bg-emerald-700">Publish transaction</Button></div>
          </div> : <p className="text-sm text-slate-500">Chọn một draft trong hàng chờ để kiểm duyệt.</p>}</CardContent>
        </Card>
      </div>
    </div>
  );
}
