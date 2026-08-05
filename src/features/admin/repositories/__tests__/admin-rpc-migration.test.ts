import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260805100930_admin_user_management_rpc.sql"),
  "utf8",
);

describe("admin user management migration", () => {
  it("keeps last-admin protection, update, and audit insert in transactional RPCs", () => {
    expect(sql).toContain("admin_change_user_role");
    expect(sql).toContain("admin_change_user_status");
    expect(sql).toContain("for update");
    expect(sql).toContain("LAST_ACTIVE_ADMIN");
    expect(sql).toContain("insert into public.admin_logs");
    expect(sql).toContain("user.role_changed");
    expect(sql).toContain("user.deactivated");
    expect(sql.match(/where id = v_actor_id and role = 'admin' and is_active = true/g)).toHaveLength(4);
  });

  it("uses verified actor identity and narrow execute grants", () => {
    expect(sql).toContain("auth.uid()");
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain("from public;");
    expect(sql).toContain("from anon;");
    expect(sql).toContain("to authenticated;");
  });
});
