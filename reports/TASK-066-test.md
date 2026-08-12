# TASK-066 Test Report

## Production reproduction

- Authenticated Playwright UI retry — reproduced HTTP 500 `AI_PROVIDER_ERROR` for job 7.
- Before and after retry: status `failed`, three Lessons, one persisted Lesson content draft.
- The response completed in about 29 seconds, ruling out the route's 300-second timeout.

## Focused regression

- `npx vitest run src/features/content-pipeline/providers/lesson-draft-provider.test.ts src/features/content-pipeline/services/content-pipeline-service.test.ts --reporter=verbose`
  - PASS: 2 files, 29 tests.
  - Covers `[1, 1]` normalization to `[0]` for one chunk and rejection of out-of-range citations
    for multiple chunks.

## Required quality gates

- `npm run lint` — PASS, zero warnings.
- `npm run typecheck` — PASS.
- `npm run test` — PASS.
- `npm run build` — PASS, Next.js 15.5.22 production build and 29 static pages.
- `git diff --check` — PASS; only existing Windows line-ending conversion warnings were printed.

## Deployment verification

- `git push origin main` — PASS for commit `6d6b03c`.
- Vercel production initialization — BLOCKED: three deployments remain `UNKNOWN` without build
  logs; primary alias still serves `dpl_i5Mt1fysN5JdPCeuTH4DSoKvX7oP`.
- Final Playwright retry — not run against the unchanged alias because it would test old code.
