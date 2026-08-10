import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CourseDraftBatch,
  CreateCourseDraftBatchResult,
  ContentChapterTarget,
  ContentCourseTarget,
  ContentCurriculum,
  ContentTarget,
  DocumentChunkInput,
  LessonDraftRecord,
  LessonDraftReviewDecision,
  PublishLessonDraftResult,
  ReviewCourseDraftBatchResult,
  SourceDocumentRecord,
  StructuredLessonDraft,
  StructuredCourseDraft,
  SupportedSourceMimeType,
} from "@/features/content-pipeline/types";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

interface SourceDocumentRow {
  id: number;
  original_filename: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: SupportedSourceMimeType;
  size_bytes: number;
  status: SourceDocumentRecord["status"];
  error_code: string | null;
  created_at: string;
}

interface DocumentChunkRow {
  id: number;
  chunk_index: number;
  content: string;
}

interface LessonDraftRow {
  id: number;
  source_document_id: number;
  course_id: number;
  chapter_id: number;
  target_lesson_id: number;
  title: string;
  summary: string;
  estimated_minutes: number;
  sections: unknown;
  status: LessonDraftRecord["status"];
  revision: number;
  approved_revision: number | null;
  provider: string;
  model: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

async function client(): Promise<SupabaseClient> {
  return (await createServerSupabaseClient()) as unknown as SupabaseClient;
}

function adminClient(): SupabaseClient {
  return createAdminSupabaseClient() as unknown as SupabaseClient;
}

function mapSource(row: SourceDocumentRow): SourceDocumentRecord {
  return {
    id: row.id,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    status: row.status,
    errorCode: row.error_code,
    createdAt: row.created_at,
  };
}

function mapDraft(row: LessonDraftRow): LessonDraftRecord {
  return {
    id: row.id,
    sourceDocumentId: row.source_document_id,
    courseId: row.course_id,
    chapterId: row.chapter_id,
    targetLessonId: row.target_lesson_id,
    title: row.title,
    summary: row.summary,
    estimatedMinutes: row.estimated_minutes,
    sections: row.sections as LessonDraftRecord["sections"],
    status: row.status,
    revision: row.revision,
    approvedRevision: row.approved_revision,
    provider: row.provider,
    model: row.model,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createSourceDocument(input: {
  uploadedBy: string;
  originalFilename: string;
  storagePath: string;
  mimeType: SupportedSourceMimeType;
  sizeBytes: number;
}): Promise<SourceDocumentRecord> {
  const supabase = await client();
  const { data, error } = await supabase.from("source_documents").insert({
    uploaded_by: input.uploadedBy,
    original_filename: input.originalFilename,
    storage_path: input.storagePath,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
  }).select("*").single();
  if (error || !data) throw new Error("DATABASE_ERROR");
  return mapSource(data as SourceDocumentRow);
}

export async function uploadSourceObject(path: string, file: File): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.storage.from("lesson-sources").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error("STORAGE_ERROR");
}

export async function removeSourceObject(path: string): Promise<void> {
  const supabase = await client();
  await supabase.storage.from("lesson-sources").remove([path]);
}

export async function getSourceDocument(id: number): Promise<(SourceDocumentRow & SourceDocumentRecord) | null> {
  const supabase = await client();
  const { data, error } = await supabase.from("source_documents").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("DATABASE_ERROR");
  if (!data) return null;
  return Object.assign(data as SourceDocumentRow, mapSource(data as SourceDocumentRow));
}

export async function updateSourceStatus(
  id: number,
  status: SourceDocumentRecord["status"],
  errorCode: string | null = null
): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.from("source_documents").update({ status, error_code: errorCode }).eq("id", id);
  if (error) throw new Error("DATABASE_ERROR");
}

export async function downloadSourceObject(bucket: string, path: string): Promise<Buffer> {
  const supabase = await client();
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) throw new Error("STORAGE_ERROR");
  return Buffer.from(await data.arrayBuffer());
}

export async function replaceDocumentChunks(
  sourceDocumentId: number,
  sha256: string,
  extractedCharCount: number,
  chunks: DocumentChunkInput[]
): Promise<void> {
  const supabase = await client();
  const { error } = await supabase.rpc("replace_document_chunks", {
    p_source_document_id: sourceDocumentId,
    p_sha256: sha256,
    p_extracted_char_count: extractedCharCount,
    p_chunks: chunks,
  });
  if (error) throw new Error("DATABASE_ERROR");
}

export async function getGenerationContext(sourceDocumentId: number, lessonId: number) {
  // generateLessonDraft authorizes an active Admin before entering this
  // repository. Use the server-only client so a newly created unpublished lesson
  // cannot disappear behind the public publish-only curriculum policies.
  const supabase = adminClient();
  const [documentResult, chunksResult, lessonResult] = await Promise.all([
    supabase.from("source_documents").select("*").eq("id", sourceDocumentId).maybeSingle(),
    supabase.from("document_chunks").select("id, chunk_index, content").eq("source_document_id", sourceDocumentId).order("chunk_index"),
    supabase.from("lessons").select("id, title, chapter_id, chapters!inner(id, course_id)").eq("id", lessonId).maybeSingle(),
  ]);
  if (documentResult.error || chunksResult.error || lessonResult.error) throw new Error("DATABASE_ERROR");
  if (!documentResult.data || !lessonResult.data) return null;
  const lesson = lessonResult.data as unknown as {
    id: number;
    title: string;
    chapter_id: number;
    chapters: { id: number; course_id: number };
  };
  return {
    document: documentResult.data as SourceDocumentRow,
    chunks: (chunksResult.data ?? []) as DocumentChunkRow[],
    lesson,
  };
}

export async function getCourseGenerationContext(sourceDocumentId: number) {
  const supabase = adminClient();
  const [documentResult, chunksResult] = await Promise.all([
    supabase.from("source_documents").select("*").eq("id", sourceDocumentId).maybeSingle(),
    supabase.from("document_chunks").select("id, chunk_index, content").eq("source_document_id", sourceDocumentId).order("chunk_index"),
  ]);
  if (documentResult.error || chunksResult.error) throw new Error("DATABASE_ERROR");
  if (!documentResult.data) return null;
  return {
    document: documentResult.data as SourceDocumentRow,
    chunks: (chunksResult.data ?? []) as DocumentChunkRow[],
  };
}

export async function persistGeneratedCourseDraft(input: {
  sourceDocumentId: number;
  courseSlug: string;
  draft: StructuredCourseDraft;
  provider: string;
  model: string;
}): Promise<CreateCourseDraftBatchResult> {
  const supabase = await client();
  const { data, error } = await supabase.rpc("create_course_lesson_drafts", {
    p_source_document_id: input.sourceDocumentId,
    p_course_title: input.draft.title,
    p_course_slug: input.courseSlug,
    p_course_description: input.draft.description,
    p_lessons: input.draft.lessons,
    p_provider: input.provider,
    p_model: input.model,
  });
  if (error || !data || typeof data !== "object") throw new Error("DATABASE_ERROR");
  const result = data as unknown as CreateCourseDraftBatchResult;
  if (
    !Number.isSafeInteger(result.courseId) || result.courseId <= 0 ||
    !Array.isArray(result.lessonDraftIds) || result.lessonDraftIds.length < 1
  ) {
    throw new Error("DATABASE_ERROR");
  }
  return result;
}

export async function listCourseDraftBatches(): Promise<CourseDraftBatch[]> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("lesson_drafts")
    .select("*, source_documents!inner(original_filename, status), courses!inner(title, description)")
    .in("status", ["pending_review", "needs_revision"])
    .eq("source_documents.status", "ready_for_review")
    .is("courses.archived_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error("DATABASE_ERROR");

  const groups = new Map<number, CourseDraftBatch>();
  for (const raw of data ?? []) {
    const row = raw as unknown as LessonDraftRow & {
      source_documents: { original_filename: string; status: string };
      courses: { title: string; description: string | null };
    };
    const existing = groups.get(row.source_document_id);
    const draft = mapDraft(row);
    if (existing) {
      existing.lessons.push(draft);
      if (draft.status === "needs_revision") existing.status = "needs_revision";
      continue;
    }
    groups.set(row.source_document_id, {
      sourceDocumentId: row.source_document_id,
      sourceFilename: row.source_documents.original_filename,
      courseId: row.course_id,
      courseTitle: row.courses.title,
      courseDescription: row.courses.description,
      status: draft.status === "needs_revision" ? "needs_revision" : "pending_review",
      createdAt: row.created_at,
      lessons: [draft],
    });
  }
  return [...groups.values()].map((batch) => ({
    ...batch,
    lessons: batch.lessons.sort((left, right) => left.id - right.id),
  }));
}

export async function reviewCourseDraftBatch(
  sourceDocumentId: number,
  decision: LessonDraftReviewDecision,
  comment: string | null
): Promise<ReviewCourseDraftBatchResult> {
  const supabase = await client();
  const { data, error } = await supabase.rpc("review_course_draft_batch", {
    p_source_document_id: sourceDocumentId,
    p_decision: decision,
    p_comment: comment,
  });
  if (error || !data || typeof data !== "object") throw new Error("DATABASE_ERROR");
  return data as unknown as ReviewCourseDraftBatchResult;
}

export async function persistGeneratedDraft(input: {
  sourceDocumentId: number;
  courseId: number;
  chapterId: number;
  targetLessonId: number;
  draft: StructuredLessonDraft;
  provider: string;
  model: string;
}): Promise<number> {
  const citations = input.draft.sections.flatMap((section, sectionIndex) =>
    section.citationChunkIndexes.map((chunkIndex) => ({ sectionIndex, chunkIndex }))
  );
  const supabase = await client();
  const { data, error } = await supabase.rpc("create_lesson_draft", {
    p_source_document_id: input.sourceDocumentId,
    p_course_id: input.courseId,
    p_chapter_id: input.chapterId,
    p_target_lesson_id: input.targetLessonId,
    p_title: input.draft.title,
    p_summary: input.draft.summary,
    p_estimated_minutes: input.draft.estimatedMinutes,
    p_sections: input.draft.sections,
    p_provider: input.provider,
    p_model: input.model,
    p_citations: citations,
  });
  if (error || typeof data !== "number") throw new Error("DATABASE_ERROR");
  return data;
}

export async function listLessonDrafts(status?: LessonDraftRecord["status"]): Promise<LessonDraftRecord[]> {
  const supabase = await client();
  let query = supabase.from("lesson_drafts").select("*").order("created_at", { ascending: false }).limit(100);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw new Error("DATABASE_ERROR");
  return ((data ?? []) as LessonDraftRow[]).map(mapDraft);
}

export async function getLessonDraft(id: number): Promise<LessonDraftRecord | null> {
  const supabase = await client();
  const [draftResult, citationResult] = await Promise.all([
    supabase.from("lesson_drafts").select("*").eq("id", id).maybeSingle(),
    supabase.from("lesson_draft_citations")
      .select("revision, section_index, quote, document_chunks!inner(chunk_index)")
      .eq("lesson_draft_id", id)
      .order("section_index"),
  ]);
  if (draftResult.error || citationResult.error) throw new Error("DATABASE_ERROR");
  if (!draftResult.data) return null;
  const draft = mapDraft(draftResult.data as LessonDraftRow);
  draft.citations = ((citationResult.data ?? []) as unknown as Array<{
    revision: number;
    section_index: number;
    quote: string;
    document_chunks: { chunk_index: number };
  }>).filter((citation) => citation.revision === draft.revision).map((citation) => ({
    sectionIndex: citation.section_index,
    chunkIndex: citation.document_chunks.chunk_index,
    quote: citation.quote,
  }));
  return draft;
}

export async function reviseLessonDraft(id: number, draft: StructuredLessonDraft): Promise<number> {
  const supabase = await client();
  const { data, error } = await supabase.rpc("revise_lesson_draft", {
    p_lesson_draft_id: id,
    p_title: draft.title,
    p_summary: draft.summary,
    p_estimated_minutes: draft.estimatedMinutes,
    p_sections: draft.sections,
  });
  if (error || typeof data !== "number") throw new Error("DATABASE_ERROR");
  return data;
}

export async function reviewLessonDraft(
  id: number,
  decision: LessonDraftReviewDecision,
  comment: string | null
): Promise<string> {
  const supabase = await client();
  const { data, error } = await supabase.rpc("review_lesson_draft", {
    p_lesson_draft_id: id,
    p_decision: decision,
    p_comment: comment,
  });
  if (error || typeof data !== "string") throw new Error("DATABASE_ERROR");
  return data;
}

export async function publishLessonDraft(id: number): Promise<PublishLessonDraftResult> {
  const supabase = await client();
  const { data, error } = await supabase.rpc("publish_lesson_draft", { p_lesson_draft_id: id });
  if (error || !data || typeof data !== "object") throw new Error("DATABASE_ERROR");
  const result = data as unknown as PublishLessonDraftResult;
  if (result.status !== "published" || typeof result.lessonId !== "number") throw new Error("DATABASE_ERROR");
  return result;
}

export async function listContentTargets(): Promise<ContentTarget[]> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, chapter_id, is_published, chapters!inner(id, title, course_id, courses!inner(id, title))")
    .order("id", { ascending: true });
  if (error) throw new Error("DATABASE_ERROR");
  return ((data ?? []) as unknown as Array<{
    id: number;
    title: string;
    chapter_id: number;
    is_published: boolean;
    chapters: { id: number; title: string; course_id: number; courses: { id: number; title: string } };
  }>).map((row) => ({
    lessonId: row.id,
    lessonTitle: row.title,
    chapterId: row.chapters.id,
    chapterTitle: row.chapters.title,
    courseId: row.chapters.courses.id,
    courseTitle: row.chapters.courses.title,
    isPublished: row.is_published,
  }));
}

export async function listContentChapters(): Promise<ContentChapterTarget[]> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("chapters")
    .select("id, title, course_id, courses!inner(id, title)")
    .order("id", { ascending: true });
  if (error) throw new Error("DATABASE_ERROR");
  return ((data ?? []) as unknown as Array<{
    id: number;
    title: string;
    course_id: number;
    courses: { id: number; title: string };
  }>).map((row) => ({
    chapterId: row.id,
    chapterTitle: row.title,
    courseId: row.courses.id,
    courseTitle: row.courses.title,
  }));
}

export async function listContentCourses(): Promise<ContentCourseTarget[]> {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, title")
    .is("archived_at", null)
    .order("id", { ascending: true });
  if (error) throw new Error("DATABASE_ERROR");
  return ((data ?? []) as Array<{ id: number; title: string }>).map((row) => ({
    courseId: row.id,
    courseTitle: row.title,
  }));
}

export async function createContentTarget(input: {
  chapterId: number;
  title: string;
}): Promise<ContentTarget> {
  const supabase = await client();
  const { data, error } = await supabase.rpc("create_lesson_content_target", {
    p_chapter_id: input.chapterId,
    p_title: input.title,
  });
  if (error?.code === "P0002") throw new Error("CHAPTER_NOT_FOUND");
  if (error || !data || typeof data !== "object") throw new Error("DATABASE_ERROR");
  const target = data as unknown as ContentTarget;
  if (!Number.isSafeInteger(target.lessonId) || target.lessonId <= 0) {
    throw new Error("DATABASE_ERROR");
  }
  return target;
}

export async function createContentCurriculum(input: {
  courseTitle: string;
  courseSlug: string;
  chapterTitle: string;
}): Promise<ContentCurriculum> {
  const supabase = await client();
  const { data, error } = await supabase.rpc("create_content_curriculum", {
    p_course_title: input.courseTitle,
    p_course_slug: input.courseSlug,
    p_chapter_title: input.chapterTitle,
  });
  if (error || !data || typeof data !== "object") throw new Error("DATABASE_ERROR");
  const curriculum = data as unknown as ContentCurriculum;
  if (!Number.isSafeInteger(curriculum.courseId) || curriculum.courseId <= 0
    || !Number.isSafeInteger(curriculum.chapterId) || curriculum.chapterId <= 0
    || !Number.isSafeInteger(curriculum.lessonId) || curriculum.lessonId <= 0) {
    throw new Error("DATABASE_ERROR");
  }
  return curriculum;
}

export async function createContentTargetInCourse(input: {
  courseId: number;
  chapterTitle: string;
}): Promise<ContentTarget> {
  const supabase = await client();
  const { data, error } = await supabase.rpc("create_content_target_in_course", {
    p_course_id: input.courseId,
    p_chapter_title: input.chapterTitle,
  });
  if (error?.code === "P0002") throw new Error("COURSE_NOT_FOUND");
  if (error || !data || typeof data !== "object") throw new Error("DATABASE_ERROR");
  const target = data as unknown as ContentTarget;
  if (!Number.isSafeInteger(target.lessonId) || target.lessonId <= 0) {
    throw new Error("DATABASE_ERROR");
  }
  return target;
}
