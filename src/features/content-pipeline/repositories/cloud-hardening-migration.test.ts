import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/016_harden_cloud_permissions_and_indexes.sql"),
  "utf8"
);

describe("Cloud permission and index hardening migration", () => {
  it("removes anonymous access from legacy security-definer functions", () => {
    expect(sql).toContain(
      "revoke all on function public.handle_new_user() from public, anon, authenticated"
    );
    expect(sql).toContain(
      "revoke all on function public.has_role(public.user_role) from public, anon, authenticated"
    );
    expect(sql).toContain(
      "revoke all on function public.enroll_course(bigint) from public, anon"
    );
    expect(sql).toContain(
      "revoke all on function public.submit_exercise(bigint, jsonb) from public, anon"
    );
  });

  it("uses init-plan-safe auth checks in every recreated policy", () => {
    expect(sql).toContain("(select auth.uid())");
    const statements = sql.replace(/^--.*$/gm, "");
    expect(statements.match(/auth\.uid\(\)/g)).toHaveLength(
      statements.match(/select auth\.uid\(\)/g)?.length ?? 0
    );
  });

  it("covers all foreign keys reported by the Cloud advisor", () => {
    expect(sql.match(/create index if not exists/g)).toHaveLength(14);
    for (const index of [
      "idx_submissions_exercise_id",
      "idx_generated_exercises_requested_by",
      "idx_exercise_reviews_reviewer_id",
      "source_documents_uploaded_by_idx",
      "lesson_drafts_source_document_idx",
      "lesson_drafts_chapter_idx",
      "lesson_drafts_target_lesson_idx",
      "lesson_drafts_requested_by_idx",
      "lesson_draft_citations_document_chunk_idx",
      "lesson_draft_reviews_reviewer_idx",
      "lesson_draft_publications_source_document_idx",
      "lesson_draft_publications_course_idx",
      "lesson_draft_publications_lesson_idx",
      "lesson_draft_publications_published_by_idx",
    ]) {
      expect(sql).toContain(index);
    }
  });
});
