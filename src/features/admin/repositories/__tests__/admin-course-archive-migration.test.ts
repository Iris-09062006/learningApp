import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/024_admin_course_archival.sql"),
  "utf8",
);

describe("admin course archival migration", () => {
  it("adds archive state and keeps deletion atomic and history-preserving", () => {
    expect(sql).toContain("add column archived_at timestamptz");
    expect(sql).toContain("courses_archived_not_published");
    expect(sql).toContain("archived_at is null or not is_published");
    expect(sql).toContain("admin_archive_course");
    expect(sql).toContain("set is_published = false");
    expect(sql).not.toMatch(/delete\s+from\s+public\./i);
    expect(sql).toContain("'course.archived'");
    expect(sql).toContain("insert into public.admin_logs");
  });

  it("authorizes the verified actor and exposes the RPC only to authenticated users", () => {
    expect(sql).toContain("auth.uid()");
    expect(sql).toContain("role = 'admin' and is_active = true");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("from public;");
    expect(sql).toContain("from anon;");
    expect(sql).toContain("to authenticated;");
  });
});
