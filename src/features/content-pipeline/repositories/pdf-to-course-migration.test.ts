import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const sql = readFileSync(join(process.cwd(), "supabase/migrations/025_pdf_to_course_pipeline.sql"), "utf8");
const publishHotfixSql = readFileSync(join(process.cwd(), "supabase/migrations/027_fix_course_publish_markdown_json_precedence.sql"), "utf8");

describe("PDF-to-Course migration", () => {
  it("creates normalized import, outline, Lesson content, review, and publication records", () => {
    for (const table of [
      "course_import_jobs", "course_drafts", "course_draft_objectives",
      "course_outline_lessons", "course_outline_lesson_objectives",
      "course_outline_lesson_sources", "lesson_content_drafts",
      "lesson_content_draft_citations", "course_import_reviews",
      "course_import_publications", "course_import_lesson_publications",
    ]) expect(sql).toContain(`create table public.${table}`);
  });

  it("separates outline, content generation, review, and atomic publish RPCs", () => {
    expect(sql).toContain("create or replace function public.create_course_outline");
    expect(sql).toContain("create or replace function public.prepare_course_lesson_generation");
    expect(sql).toContain("create or replace function public.persist_lesson_content_draft");
    expect(sql).toContain("create or replace function public.publish_course_import_job");
    expect(sql).toContain("where id = p_job_id for update");
    expect(sql).toContain("v_job.status <> 'ready_to_publish'");
    expect(sql).toContain("v_job.status not in ('content_review', 'ready_to_publish')");
    expect(sql).toContain("revised_item.section->'citationChunkIndexes' is distinct from current_item.section->'citationChunkIndexes'");
  });

  it("never creates Exercises during Course import", () => {
    expect(sql).not.toMatch(/insert\s+into\s+public\.(generated_exercises|exercises|exercise_options|exercise_solutions)/i);
    expect(sql).not.toMatch(/update\s+public\.(generated_exercises|exercises)/i);
  });

  it("extracts JSON section fields before concatenating Markdown", () => {
    const safeMarkdownExpression = "'## ' || (section->>'heading') || E'\\n\\n' || (section->>'bodyMarkdown')";

    expect(sql).toContain(safeMarkdownExpression);
    expect(publishHotfixSql).toContain(safeMarkdownExpression);
    expect(publishHotfixSql).not.toContain("'## ' || section->>'heading'");
  });

  it("authorizes active Admins and hardens every state-changing function", () => {
    expect(sql).toContain("p.is_active and p.role = 'admin'");
    expect(sql.match(/security definer/g)?.length).toBeGreaterThanOrEqual(8);
    expect(sql.match(/set search_path = ''/g)?.length).toBeGreaterThanOrEqual(8);
    expect(sql).toContain("revoke all on function public.publish_course_import_job");
    expect(sql).toContain("from public, anon");
  });

  it("initializes a job on upload and persists resolved states", () => {
    expect(sql).toContain("create trigger initialize_course_import_job_after_source");
    expect(sql).toContain("after insert on public.source_documents");
    expect(sql).toContain("status = 'published', published_course_id = v_course.id");
    expect(sql).toContain("v_next := 'rejected'");
  });
});
