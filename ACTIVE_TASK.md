# Active Task Queue

- **Active task:** `TASK-041` — Preview Deployment and Smoke Verification
- **Status:** `BLOCKED`
- **Owner:** Codex
- **Previous task:** `TASK-040` — Performance and Release Readiness (`VERIFIED`)

## Current objective

Deploy the clean release candidate to a non-Production Preview and verify environment
separation, health, critical smoke flows, logs and rollback evidence.

## Delivery order

1. Commit and push the verified TASK-037/038 release candidate without unrelated workspace files.
2. Apply migration `017_add_distributed_rate_limits.sql` to Supabase Development.
3. Deploy that exact clean commit to Vercel Preview and run health/role smoke/log checks.
4. Record rollback evidence, review the task artifacts and commit reports.

## Current state

TASK-037 and TASK-038 are verified locally with 408 tests, a clean production build,
and Supabase local migration/RLS assertions. Vercel project `learning_app` now has
Preview environment values. TASK-041 remains blocked until the new release commit is
pushed and migration `017` is applied to the non-Production Supabase project;
Production is untouched.
