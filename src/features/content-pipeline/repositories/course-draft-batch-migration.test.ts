import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/023_course_draft_batches.sql"),
  "utf8"
);

describe("Course draft batch migration", () => {
  it("creates Course, Chapter, multiple Lesson targets and cited drafts atomically", () => {
    expect(sql).toContain("create or replace function public.create_course_lesson_drafts");
    expect(sql).toContain("jsonb_array_elements(p_lessons)");
    expect(sql).toContain("jsonb_array_length(p_lessons) not between 2 and 20");
    expect(sql).toContain("insert into public.courses");
    expect(sql).toContain("insert into public.chapters");
    expect(sql).toContain("insert into public.lessons");
    expect(sql).toContain("insert into public.lesson_drafts");
    expect(sql).toContain("insert into public.lesson_draft_citations");
    expect(sql).not.toMatch(/insert\s+into\s+public\.(generated_exercises|exercises)/i);
  });

  it("requires an active Admin and keeps provider access behind authenticated RPCs", () => {
    expect(sql.match(/p\.is_active and p\.role = 'admin'/g)?.length).toBe(2);
    expect(sql).toContain("security definer");
    expect(sql).toContain("revoke all on function public.create_course_lesson_drafts");
    expect(sql).toContain("grant execute on function public.review_course_draft_batch");
  });

  it("persists reject and publishes every approved Lesson before archiving the source", () => {
    expect(sql).toContain("set status = 'rejected'");
    expect(sql).toContain("v_publication := public.publish_lesson_draft(v_draft.id)");
    expect(sql.match(/update public\.source_documents set status = 'archived'/g)?.length).toBe(2);
    expect(sql).toContain("insert into public.lesson_draft_reviews");
  });
});
