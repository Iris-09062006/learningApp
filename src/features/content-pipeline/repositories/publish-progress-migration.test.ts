import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/022_backfill_progress_on_lesson_publish.sql"),
  "utf8",
);

describe("lesson draft publish progress migration", () => {
  it("keeps the publish RPC active-Admin-only and transaction-scoped", () => {
    expect(migration).toContain("create or replace function public.publish_lesson_draft");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain("p.role = 'admin'");
    expect(migration).toContain("revoke all on function public.publish_lesson_draft(bigint) from public, anon");
    expect(migration).toContain("grant execute on function public.publish_lesson_draft(bigint) to authenticated");
  });

  it("inserts only missing progress for non-cancelled enrollments", () => {
    expect(migration).toContain("insert into public.user_progress (user_id, lesson_id, status)");
    expect(migration).toContain("enrollment.status <> 'cancelled'");
    expect(migration).toContain("on conflict (user_id, lesson_id) do nothing");
    expect(migration).toContain("prior_progress.status = 'completed'");
  });

  it("reactivates completed enrollments and returns visibility on idempotent publish", () => {
    expect(migration).toContain("set status = 'active', completed_at = null");
    expect(migration).toContain("'coursePublished', (");
    expect(migration).toContain("select c.is_published from public.courses c");
  });
});
