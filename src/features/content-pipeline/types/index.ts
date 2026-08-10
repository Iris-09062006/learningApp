export const SUPPORTED_SOURCE_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type SupportedSourceMimeType = (typeof SUPPORTED_SOURCE_MIME_TYPES)[number];
export type SourceDocumentStatus =
  | "uploaded"
  | "extracting"
  | "extracted"
  | "generating"
  | "ready_for_review"
  | "failed"
  | "archived";
export type LessonDraftStatus =
  | "pending_review"
  | "needs_revision"
  | "rejected"
  | "approved"
  | "published";
export type LessonDraftReviewDecision = "approved" | "rejected" | "needs_revision";

export interface DocumentChunkInput {
  chunkIndex: number;
  content: string;
  startOffset: number;
  endOffset: number;
  contentHash: string;
}

export interface LessonDraftSection {
  heading: string;
  bodyMarkdown: string;
  citationChunkIndexes: number[];
}

export interface StructuredLessonDraft {
  title: string;
  summary: string;
  estimatedMinutes: number;
  sections: LessonDraftSection[];
}

export interface LessonDraftGenerationRequest {
  documentTitle: string;
  lessonTitle: string;
  chunks: Array<{ chunkIndex: number; content: string }>;
}

export interface LessonDraftGenerationResponse {
  draft: StructuredLessonDraft;
  provider: string;
  model: string;
}

export interface SourceDocumentRecord {
  id: number;
  originalFilename: string;
  mimeType: SupportedSourceMimeType;
  sizeBytes: number;
  status: SourceDocumentStatus;
  errorCode: string | null;
  createdAt: string;
}

export interface LessonDraftRecord {
  id: number;
  sourceDocumentId: number;
  courseId: number;
  chapterId: number;
  targetLessonId: number;
  title: string;
  summary: string;
  estimatedMinutes: number;
  sections: LessonDraftSection[];
  status: LessonDraftStatus;
  revision: number;
  approvedRevision: number | null;
  provider: string;
  model: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  citations?: Array<{
    sectionIndex: number;
    chunkIndex: number;
    quote: string;
  }>;
}

export interface PublishLessonDraftResult {
  lessonDraftId: number;
  lessonId: number;
  courseId: number;
  status: "published";
  coursePublished: boolean;
  publishedAt: string;
}

export interface ContentTarget {
  lessonId: number;
  lessonTitle: string;
  chapterId: number;
  chapterTitle: string;
  courseId: number;
  courseTitle: string;
}

export interface ContentChapterTarget {
  chapterId: number;
  chapterTitle: string;
  courseId: number;
  courseTitle: string;
}

export type ContentCurriculum = ContentChapterTarget;
