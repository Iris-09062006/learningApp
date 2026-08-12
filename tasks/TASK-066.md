# TASK-066 — Normalize Single-Chunk Lesson Citations

## Status
`IN_PROGRESS`

## Owner / Reviewer
Codex / Codex

## Objective
Make Lesson-content generation resilient when a provider returns 1-based or duplicate integer
citations for a document with exactly one server-owned source chunk.

## Evidence
- Playwright reproduced the production failure on Course import job 7.
- The job has three approved outline Lessons, all owned by source chunk `0`; only one Lesson
  content draft persisted before `LESSON_GENERATION_FAILED`.
- Retrying through the production Admin UI returned HTTP 500 with the generic
  `AI_PROVIDER_ERROR` and left the job safely retryable with one of three Lessons complete.
- The Lesson parser did not have the deterministic single-chunk citation normalization already
  used by the Course-outline parser.

## Scope
- Canonicalize non-empty integer Lesson-section citations to the sole server-owned chunk when
  exactly one chunk is supplied.
- Preserve strict rejection of non-integer citations and out-of-range or duplicate citations when
  multiple chunks are supplied.
- Tell the provider the exact citation required for a one-chunk Lesson request.
- Add regression tests, run all gates, review, commit, push, deploy, and verify production.

## Acceptance Criteria
- [x] One-chunk Lesson responses using 1-based or duplicate integer citations resolve to the sole
  server-owned chunk index.
- [x] Multi-chunk Lesson responses still reject out-of-range citations.
- [x] No source text, output, filename, credential, or token is logged.
- [x] Required quality gates and review pass.
- [ ] The fix is deployed and the failed production batch completes.

## Blocker

Commit `6d6b03c` is pushed to `origin/main`, but Vercel did not start a usable build. Three
production deployments (`dpl_93veKpyqD3GydZio82e1ygHafNEG` and the deployments at
`learning-eussf1pw1-iris-projects-bcfa9d19.vercel.app` and
`learning-nol35djms-iris-projects-bcfa9d19.vercel.app`) remain `UNKNOWN` with no duration or build
logs. The primary alias still points to ready deployment `dpl_i5Mt1fysN5JdPCeuTH4DSoKvX7oP`, so
running the final Playwright retry would only retest the old code.

The alternative prebuilt route completed the Next.js build but Windows denied the symlink creation
required while packaging Vercel functions (`EPERM`). The temporary worktree and copied environment
file were removed after diagnosis.

## CI recovery

GitHub Actions run `31617541601` showed lint, typecheck, and all 535 tests passing. The build alone
failed because the workflow did not provide the public Supabase variables that Next.js snapshots
during `next build`; the dependent E2E job was consequently skipped. The workflow now uses safe
CI-only placeholders during quality gates and Node 22 to match `package.json`. Local reproduction
with those exact placeholders builds all 29 pages successfully.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `git diff --check`
