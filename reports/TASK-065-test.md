# TASK-065 Test Report

## Diagnosis

- Hosted sources 23 and 24 each persisted 2,392 extracted characters before failing at Course
  outline generation.
- A non-private synthetic request to the configured provider returned HTTP 200 and passed the same
  schema/parser, confirming the provider configuration and structured-output feature are active.
- No private PDF content was sent during diagnosis outside the application's already authorized
  production workflow.

## Focused regression

- `npx vitest run src/features/content-pipeline/providers/lesson-draft-provider.test.ts src/features/content-pipeline/services/content-pipeline-service.test.ts --reporter=verbose`
  - PASS: 2 files, 26 tests.
  - Covers one-request success, invalid-response correction, successful retry, second-invalid
    rejection, no retry for HTTP failure, and service wiring for second-call quota consumption.

## Required quality gates

- `npm run lint` — PASS, zero warnings.
- `npm run typecheck` — PASS.
- `npm run test` — PASS.
- `npm run build` — PASS, Next.js 15.5.22 production build.
- `git diff --check` — PASS; only existing Windows line-ending conversion warnings were printed.

Expected stderr from negative-path tests remained present; the full suite exit code was 0.

## Production deployment

- PASS: Vercel compiled, checked types, generated pages, traced server functions, and deployed.
- PASS: deployment `dpl_HebK3MAWR9dsYTA9MZnoRi4CmM4K` reports target `production`, status `Ready`.
- Pending: authenticated regeneration of source 23 or 24 to verify the content-dependent retry.

## Follow-up verification

- Focused provider/service suite — PASS: 2 files, 28 tests.
- `npm run lint` — PASS with zero warnings.
- `npm run typecheck` — PASS.
- `npm test` — PASS: 96 files, 534 tests.
- `npm run build` — PASS: Next.js 15.5.22 production build, 29 static pages.
- Regression coverage proves one-chunk `[1]` and `[1, 1]` citations become `[0]`, while an
  out-of-range citation remains rejected for multi-chunk sources.
