# Active Task Queue

- **Active task:** `TASK-041` — Preview Deployment and Smoke Verification
- **Status:** `VERIFIED`
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

TASK-041 is verified. TASK-037 and TASK-038 are committed and pushed to
`preview/task-041` at `a4880d8`. The replacement Vercel project `learning-app`
successfully built Preview deployment `dpl_DzH7cr8iR8pKqXdk7dLJcmXhRome` from an
archive of that exact commit. Preview env is complete and newline-free, Supabase
health is connected, Gemini OpenAI compatibility returns HTTP 200, and Development
migration `017` has the intended RLS/grants. Authenticated learner, moderator and
admin authorization smoke passed all nine assertions. The three disposable users
were logged out and deleted, with profile cleanup verified. Production is untouched.
