import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(resolve(process.cwd(), "supabase/migrations/026_lesson_to_exercise_pipeline.sql"), "utf8").toLowerCase();

describe("Lesson to Exercise migration contract", () => {
  it("exposes authenticated RPC boundaries with an empty search path", () => {
    for (const name of ["get_lesson_exercise_generation_context", "create_generated_exercise_draft", "review_generated_exercise_draft", "publish_generated_exercise"]) {
      expect(sql).toContain(`function public.${name}`);
    }
    expect(sql.match(/security definer/g)?.length).toBeGreaterThanOrEqual(4);
    expect(sql.match(/set search_path = ''/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it("removes direct draft/review mutations and keeps transitions transactional", () => {
    expect(sql).toContain("revoke insert, update, delete on table public.generated_exercises from anon, authenticated");
    expect(sql).toContain("revoke insert, update, delete on table public.exercise_reviews from anon, authenticated");
    expect(sql).toContain("where id = p_generated_exercise_id for update");
    expect(sql).toContain("pg_advisory_xact_lock(v_draft.lesson_id)");
  });

  it("publishes options with real IDs and is idempotent", () => {
    expect(sql).toContain("returning id into v_option_id");
    expect(sql).toContain("jsonb_build_object('correctoptionid', v_correct_option_id)");
    expect(sql).toContain("if v_draft.status = 'published' and v_draft.published_exercise_id is not null then");
  });

  it("does not mutate Course import state", () => {
    expect(sql).not.toMatch(/update\s+public\.course_import_jobs/);
    expect(sql).not.toMatch(/insert\s+into\s+public\.course_import_jobs/);
  });
});
