import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/021_allow_active_admins_read_curriculum.sql",
  ),
  "utf8",
);

describe("active Admin curriculum visibility migration", () => {
  it("adds SELECT-only policies for every curriculum level", () => {
    for (const table of ["courses", "chapters", "lessons"]) {
      expect(sql).toContain(`on public.${table} for select to authenticated`);
    }
    expect(sql.match(/create policy/g)).toHaveLength(3);
    expect(sql).not.toMatch(/for (all|insert|update|delete)/);
  });

  it("requires the current profile to be an active Admin", () => {
    expect(sql.match(/p\.id = \(select auth\.uid\(\)\)/g)).toHaveLength(3);
    expect(sql.match(/p\.is_active = true/g)).toHaveLength(3);
    expect(sql.match(/p\.role = 'admin'/g)).toHaveLength(3);
  });

  it("does not replace the published-content policies", () => {
    expect(sql).not.toContain('drop policy if exists "Published courses are public"');
    expect(sql).not.toContain('drop policy if exists "Published chapters are public"');
    expect(sql).not.toContain('drop policy if exists "Published lessons are public"');
  });
});
