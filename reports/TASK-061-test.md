# TASK-061 Test Report

## Quality Gates

- Focused lesson/RPC suite — PASS: 3 files, 32 tests.
- `npm run lint` — PASS, zero warnings.
- `npm run typecheck` — PASS.
- `npm run test` — PASS: 94 files, 519 tests.
- `npm run build` — PASS: production compilation and 29 static pages generated.
- `git diff --check` — PASS; line-ending notices only.

## Environment Note

The first focused Vitest attempt failed before loading the test config because the sandbox denied
the esbuild child process with `spawn EPERM`. Re-running outside the sandbox passed. This was an
execution-environment restriction, not a product or test failure.

## Hosted Supabase Verification

- Migration `20260811133320_create_start_lesson_rpc` — applied successfully.
- Catalog inspection — PASS: `SECURITY DEFINER`, empty `search_path`, authenticated execute only.
- Direct table privileges — PASS: authenticated INSERT/UPDATE remain false.
- Generated hosted types — PASS: `start_lesson({ p_lesson_id: number }): Json` is present.
- Transactional learner smoke test — PASS: first start and repeat start both returned `in_progress`,
  recorded `started_at`, and preserved the timestamp.
- Rollback verification — PASS: hosted progress remained 2 unlocked rows, 0 in-progress rows, and
  0 rows with `started_at`.
- Security Advisor reports the expected generic warning for an authenticated-callable
  `SECURITY DEFINER` function. This exposure is intentional; the function derives `auth.uid()` and
  enforces active learner, enrollment, publication, and progress-state checks internally.
