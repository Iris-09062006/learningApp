import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/019_create_content_curriculum.sql"),
  "utf8",
).toLowerCase();

describe("content curriculum migration", () => {
  it("creates course and first chapter as one Admin-authorized transaction", () => {
    expect(sql).toContain("create or replace function public.create_content_curriculum");
    expect(sql).toContain("p.is_active and p.role = 'admin'");
    expect(sql).toContain("insert into public.courses");
    expect(sql).toContain("insert into public.chapters");
    expect(sql).toContain("'content_curriculum.created'");
    expect(sql).toContain("set search_path = ''");
  });

  it("denies public and anonymous execution", () => {
    expect(sql).toContain(
      "revoke all on function public.create_content_curriculum(text, text, text) from public, anon",
    );
    expect(sql).toContain(
      "grant execute on function public.create_content_curriculum(text, text, text) to authenticated",
    );
  });
});
