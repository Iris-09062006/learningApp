import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/029_allow_sequential_lesson_advance.sql"),
  "utf8",
);

describe("sequential lesson advance migration", () => {
  it("permits only a locked lesson whose immediate published predecessor is accessible", () => {
    expect(sql).toContain("lag(lesson.id) over");
    expect(sql).toContain("previous_progress.lesson_id = v_previous_lesson_id");
    expect(sql).toContain("previous_progress.status <> 'locked'");
    expect(sql).toContain("message = 'Lesson is locked'");
  });

  it("starts the target without falsely completing the current lesson", () => {
    expect(sql).toContain("when progress.status in ('locked', 'unlocked') then 'in_progress'");
    expect(sql).not.toContain("set status = 'completed'");
    expect(sql).not.toContain("completed_at");
  });

  it("keeps the RPC restricted to authenticated callers", () => {
    expect(sql).toContain(
      "revoke all on function public.start_lesson(bigint) from public, anon, authenticated",
    );
    expect(sql).toContain("grant execute on function public.start_lesson(bigint) to authenticated");
  });
});
