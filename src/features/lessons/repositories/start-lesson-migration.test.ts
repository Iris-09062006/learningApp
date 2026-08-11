import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/028_create_start_lesson_rpc.sql"),
  "utf8",
);

describe("start lesson RPC migration", () => {
  it("keeps progress writes behind a hardened authenticated RPC", () => {
    expect(sql).toContain("create or replace function public.start_lesson(p_lesson_id bigint)");
    expect(sql).toContain("security definer");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain(
      "revoke all on function public.start_lesson(bigint) from public, anon, authenticated",
    );
    expect(sql).toContain("grant execute on function public.start_lesson(bigint) to authenticated");
    expect(sql).not.toMatch(/grant\s+(?:insert|update).*user_progress/i);
  });

  it("authorizes an active learner with a non-cancelled enrollment", () => {
    expect(sql).toContain("profile.role = 'learner'");
    expect(sql).toContain("profile.is_active = true");
    expect(sql).toContain("enrollment.status <> 'cancelled'");
    expect(sql).toContain("for update");
  });

  it("rejects missing or locked progress without inserting a new row", () => {
    expect(sql).toContain("message = 'Lesson access required'");
    expect(sql).toContain("v_progress.status = 'locked'");
    expect(sql).toContain("message = 'Lesson is locked'");
    expect(sql).not.toMatch(/insert\s+into\s+public\.user_progress/i);
  });

  it("starts only unlocked progress while preserving repeat-start state", () => {
    expect(sql).toContain("when progress.status = 'unlocked' then 'in_progress'");
    expect(sql).toContain("coalesce(progress.started_at, now())");
    expect(sql).toContain("else progress.status");
    expect(sql).toContain("else progress.started_at");
    expect(sql).toContain("last_accessed_at = now()");
    expect(sql).toContain("updated_at = now()");
  });
});
