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

## GitHub Actions diagnosis and fix verification

- Run `31617541601`, job `94184008368`: lint, typecheck, and 535 tests PASS; `next build` failed
  while prerendering because public Supabase environment variables were absent.
- Deterministic Chromium E2E was skipped because it depends on the failed quality-gates job.
- Context7 confirmed `NEXT_PUBLIC_*` variables are captured during `next build` and GitHub Actions
  supports job-level `env` values.
- Workflow fix uses CI-only placeholders and Node `22.x`, matching `package.json`.
- `npm run lint` — PASS.
- `npm run typecheck` — PASS.
- `npm run test` — PASS: 96 files, 535 tests.
- `npm run build` with the exact workflow placeholders — PASS: 29 static pages.

## Deterministic Chromium follow-up

- Run `31620540388`, quality-gates job `94193985912` — PASS, including production build.
- Run `31620540388`, E2E job `94194552561` — FAIL: 8 passed, two learner tests timed out waiting
  for “Làm bài” while the Lesson was still `unlocked`.
- Local reproduction confirmed the mock returned `Unknown RPC start_lesson` after the required
  “Bắt đầu bài học” action.
- `npm run test:e2e` after updating the learner flow and mock RPC — PASS: 10/10 tests.
- Follow-up `npm run lint` — PASS.
- Follow-up `npm run typecheck` — PASS.
- Follow-up `npm run test` — PASS: 96 files, 535 tests.
- Follow-up `npm run build` with CI placeholders — PASS: 29 static pages.
