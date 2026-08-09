import "server-only";

import { createHash, randomUUID } from "node:crypto";

import {
  chunkDocumentText,
  DocumentExtractionError,
  extractDocumentText,
} from "@/features/content-pipeline/extraction/document-extractor";
import { NineRouterLessonDraftProvider, type LessonDraftProvider } from "@/features/content-pipeline/providers/lesson-draft-provider";
import {
  createSourceDocument,
  downloadSourceObject,
  getGenerationContext,
  getLessonDraft,
  getSourceDocument,
  listLessonDrafts,
  listContentTargets,
  persistGeneratedDraft,
  publishLessonDraft,
  removeSourceObject,
  replaceDocumentChunks,
  reviewLessonDraft,
  reviseLessonDraft,
  updateSourceStatus,
  uploadSourceObject,
} from "@/features/content-pipeline/repositories/content-pipeline-repository";
import {
  SUPPORTED_SOURCE_MIME_TYPES,
  type LessonDraftReviewDecision,
  type StructuredLessonDraft,
  type SupportedSourceMimeType,
} from "@/features/content-pipeline/types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export class ContentPipelineError extends Error {
  constructor(
    public readonly code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "NOT_FOUND"
      | "VALIDATION_ERROR"
      | "INVALID_STATE"
      | "STORAGE_ERROR"
      | "EXTRACTION_ERROR"
      | "AI_PROVIDER_ERROR"
      | "DATABASE_ERROR",
    message: string
  ) {
    super(message);
    this.name = "ContentPipelineError";
  }
}

async function requireAdmin(): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new ContentPipelineError("UNAUTHENTICATED", "Authentication is required.");
  const { data: profile } = await supabase.from("profiles").select("role, is_active").eq("id", authData.user.id).maybeSingle();
  if (!profile?.is_active || profile.role !== "admin") throw new ContentPipelineError("FORBIDDEN", "Active Admin role required.");
  return authData.user.id;
}

function sanitizeFilename(name: string): string {
  const normalized = name.normalize("NFKC").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized.slice(0, 120) || "source-document";
}

function asPositiveId(value: unknown, field: string): number {
  const id = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new ContentPipelineError("VALIDATION_ERROR", `${field} must be a positive integer.`);
  return id;
}

export async function uploadContentSource(file: File) {
  const adminId = await requireAdmin();
  if (!file.name || file.size < 1 || file.size > MAX_FILE_BYTES) throw new ContentPipelineError("VALIDATION_ERROR", "File must be between 1 byte and 10 MiB.");
  if (!SUPPORTED_SOURCE_MIME_TYPES.includes(file.type as SupportedSourceMimeType)) throw new ContentPipelineError("VALIDATION_ERROR", "Unsupported document type.");
  const storagePath = `${adminId}/${randomUUID()}/${sanitizeFilename(file.name)}`;
  try {
    await uploadSourceObject(storagePath, file);
    try {
      return await createSourceDocument({
        uploadedBy: adminId,
        originalFilename: file.name,
        storagePath,
        mimeType: file.type as SupportedSourceMimeType,
        sizeBytes: file.size,
      });
    } catch (error: unknown) {
      await removeSourceObject(storagePath);
      throw error;
    }
  } catch (error: unknown) {
    if (error instanceof ContentPipelineError) throw error;
    throw new ContentPipelineError("STORAGE_ERROR", "Unable to store the source document.");
  }
}

export async function extractContentSource(value: unknown) {
  await requireAdmin();
  const id = asPositiveId(value, "documentId");
  const document = await getSourceDocument(id);
  if (!document) throw new ContentPipelineError("NOT_FOUND", "Source document not found.");
  if (!(["uploaded", "failed"] as const).includes(document.status as "uploaded" | "failed")) throw new ContentPipelineError("INVALID_STATE", "Source document cannot be extracted in its current state.");
  await updateSourceStatus(id, "extracting");
  try {
    const buffer = await downloadSourceObject(document.storage_bucket, document.storage_path);
    const text = await extractDocumentText(buffer, document.mimeType);
    const chunks = chunkDocumentText(text);
    await replaceDocumentChunks(id, createHash("sha256").update(buffer).digest("hex"), text.length, chunks);
    return { documentId: id, status: "extracted" as const, chunkCount: chunks.length, characterCount: text.length };
  } catch (error: unknown) {
    const errorCode = error instanceof DocumentExtractionError ? error.code : "EXTRACTION_FAILED";
    await updateSourceStatus(id, "failed", errorCode).catch(() => undefined);
    throw new ContentPipelineError("EXTRACTION_ERROR", "Unable to extract this document.");
  }
}

export async function generateLessonDraft(
  sourceDocumentIdValue: unknown,
  targetLessonIdValue: unknown,
  provider: LessonDraftProvider = new NineRouterLessonDraftProvider()
) {
  await requireAdmin();
  const sourceDocumentId = asPositiveId(sourceDocumentIdValue, "documentId");
  const targetLessonId = asPositiveId(targetLessonIdValue, "targetLessonId");
  const context = await getGenerationContext(sourceDocumentId, targetLessonId);
  if (!context) throw new ContentPipelineError("NOT_FOUND", "Source document or target lesson not found.");
  if (context.document.status !== "extracted") throw new ContentPipelineError("INVALID_STATE", "Source document must be extracted before generation.");
  if (!context.chunks.length) throw new ContentPipelineError("INVALID_STATE", "Source document has no extracted chunks.");
  await updateSourceStatus(sourceDocumentId, "generating");
  try {
    const selectedChunks = [] as typeof context.chunks;
    let selectedCharacters = 0;
    for (const chunk of context.chunks) {
      if (selectedCharacters + chunk.content.length > 80_000 && selectedChunks.length > 0) break;
      selectedChunks.push(chunk);
      selectedCharacters += chunk.content.length;
    }
    const generated = await provider.generateLessonDraft({
      documentTitle: context.document.original_filename,
      lessonTitle: context.lesson.title,
      chunks: selectedChunks.map((chunk) => ({ chunkIndex: chunk.chunk_index, content: chunk.content })),
    });
    const draftId = await persistGeneratedDraft({
      sourceDocumentId,
      courseId: context.lesson.chapters.course_id,
      chapterId: context.lesson.chapter_id,
      targetLessonId,
      draft: generated.draft,
      provider: generated.provider,
      model: generated.model,
    });
    return { lessonDraftId: draftId, status: "pending_review" as const };
  } catch {
    await updateSourceStatus(sourceDocumentId, "failed", "GENERATION_FAILED").catch(() => undefined);
    throw new ContentPipelineError("AI_PROVIDER_ERROR", "Unable to generate a valid cited lesson draft.");
  }
}

export async function getLessonDraftQueue(status?: string) {
  await requireAdmin();
  const allowed = ["pending_review", "needs_revision", "rejected", "approved", "published"];
  if (status && !allowed.includes(status)) throw new ContentPipelineError("VALIDATION_ERROR", "Invalid draft status.");
  return listLessonDrafts(status as Parameters<typeof listLessonDrafts>[0]);
}

export async function getLessonDraftDetail(value: unknown) {
  await requireAdmin();
  const draft = await getLessonDraft(asPositiveId(value, "draftId"));
  if (!draft) throw new ContentPipelineError("NOT_FOUND", "Lesson draft not found.");
  return draft;
}

function validateDraft(value: unknown): StructuredLessonDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ContentPipelineError("VALIDATION_ERROR", "Draft body is invalid.");
  const draft = value as Record<string, unknown>;
  if (typeof draft.title !== "string" || !draft.title.trim() || draft.title.length > 150 || typeof draft.summary !== "string" || !draft.summary.trim() || !Number.isInteger(draft.estimatedMinutes) || Number(draft.estimatedMinutes) < 1 || Number(draft.estimatedMinutes) > 180 || !Array.isArray(draft.sections) || draft.sections.length < 1 || draft.sections.length > 12) {
    throw new ContentPipelineError("VALIDATION_ERROR", "Draft fields are invalid.");
  }
  const sections = draft.sections.map((section) => {
    if (!section || typeof section !== "object" || Array.isArray(section)) throw new ContentPipelineError("VALIDATION_ERROR", "Draft section is invalid.");
    const record = section as Record<string, unknown>;
    if (typeof record.heading !== "string" || !record.heading.trim() || typeof record.bodyMarkdown !== "string" || !record.bodyMarkdown.trim() || !Array.isArray(record.citationChunkIndexes) || !record.citationChunkIndexes.every(Number.isInteger)) throw new ContentPipelineError("VALIDATION_ERROR", "Draft section is invalid.");
    return { heading: record.heading.trim(), bodyMarkdown: record.bodyMarkdown.trim(), citationChunkIndexes: record.citationChunkIndexes as number[] };
  });
  return { title: draft.title.trim(), summary: draft.summary.trim(), estimatedMinutes: Number(draft.estimatedMinutes), sections };
}

export async function updateLessonDraft(idValue: unknown, body: unknown) {
  await requireAdmin();
  const id = asPositiveId(idValue, "draftId");
  const current = await getLessonDraft(id);
  if (!current) throw new ContentPipelineError("NOT_FOUND", "Lesson draft not found.");
  const draft = validateDraft(body);
  const sameCitationSet = draft.sections.every((section, sectionIndex) => {
    const expected = (current.citations ?? [])
      .filter((citation) => citation.sectionIndex === sectionIndex)
      .map((citation) => citation.chunkIndex)
      .sort((left, right) => left - right);
    const received = [...new Set(section.citationChunkIndexes)].sort((left, right) => left - right);
    return expected.length === received.length && expected.every((value, index) => value === received[index]);
  });
  if (!sameCitationSet) throw new ContentPipelineError("VALIDATION_ERROR", "Citation indexes cannot be changed during text editing.");
  const revision = await reviseLessonDraft(id, draft);
  return { revision, status: "pending_review" as const };
}

export async function submitLessonDraftReview(idValue: unknown, body: unknown) {
  await requireAdmin();
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new ContentPipelineError("VALIDATION_ERROR", "Review body is invalid.");
  const record = body as Record<string, unknown>;
  const decisions: LessonDraftReviewDecision[] = ["approved", "rejected", "needs_revision"];
  if (!decisions.includes(record.decision as LessonDraftReviewDecision) || (record.comment !== undefined && record.comment !== null && typeof record.comment !== "string")) throw new ContentPipelineError("VALIDATION_ERROR", "Review decision is invalid.");
  const status = await reviewLessonDraft(asPositiveId(idValue, "draftId"), record.decision as LessonDraftReviewDecision, typeof record.comment === "string" ? record.comment.slice(0, 2000) : null);
  return { status };
}

export async function publishApprovedLessonDraft(idValue: unknown) {
  await requireAdmin();
  return publishLessonDraft(asPositiveId(idValue, "draftId"));
}

export async function getContentTargets() {
  await requireAdmin();
  return listContentTargets();
}
