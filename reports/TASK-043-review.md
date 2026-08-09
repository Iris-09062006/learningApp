# TASK-043 Review Report

## Verdict

`PASS` — no open Critical, High or Medium finding. Acceptance criteria and required
Cloud/local gates are satisfied.

## Findings resolved

- **High — vulnerable DOCX parser:** upgraded and pinned Mammoth `1.12.0`; audit clean.
- **High — editable citation mismatch:** edits must preserve the exact current-revision
  citation map before normalized citations can be reused.
- **High — legacy anonymous RPC execution:** hardening migration removes anon execution
  from every legacy SECURITY DEFINER function.
- **Medium — unbounded provider context:** deterministic request context capped at
  80,000 extracted characters and citations restricted to the selected chunks.
- **Medium — missing FK coverage / repeated auth evaluation:** Cloud advisor findings
  resolved with covering indexes and `(select auth.uid())` policies.
- **Medium — page authorization:** `/admin/content` performs server-side Admin auth in
  addition to API authorization and RLS.

## Accepted operational notices

- Supabase flags authenticated SECURITY DEFINER RPCs by design. Each exposed RPC is
  explicitly granted and validates the authenticated active role before privileged work.
- Leaked-password protection remains a Supabase Auth Dashboard setting, not a schema
  migration. Enable it before production launch:
  https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- `exercise_solutions` intentionally has RLS without learner policies and has no anon or
  authenticated table grant; solutions stay server/RPC-only.
