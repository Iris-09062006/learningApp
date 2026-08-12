# TASK-064 Test Report

## Focused regression

- `npx vitest run src/features/content-pipeline/extraction/document-extractor.test.ts tests/integration/pdf-runtime-config.test.ts --reporter=verbose`
  - PASS: 2 files, 7 tests.
  - Covers a real text-layer PDF, sanitized failure logging, Node 22.x, and the exact route trace
    include patterns.

## Required quality gates

- `npm run lint` — PASS, zero warnings.
- `npm run typecheck` — PASS.
- `npm run test` — PASS.
- `npm run build` — PASS, Next.js 15.5.22 production build.
- `git diff --check` — PASS; only existing Windows line-ending conversion warnings were printed.

## Build trace evidence

The extraction route `.nft.json` produced on Windows contains 5 canvas package files, 1 native
canvas binary, 20 `pdf-parse` files, and 1 `pdfjs-dist` runtime file. The Linux x64 GNU package is
declared in the lockfile and explicitly included for the corresponding Vercel Linux build.

Expected stderr from negative-path tests remained present; the full suite exit code was 0.

## Vercel production build

- PASS: clean build skipped the previous cache, installed 558 packages, compiled Next.js, checked
  types, generated 29 static pages, traced server files, and deployed successfully.
- PASS: deployment `dpl_3C4gB57Thpo2xu1TTFCDmv6r4kKe` reports target `production`, status `Ready`.
- PASS: subsequent authenticated production uploads (sources 23 and 24) each persisted 2,392
  extracted characters. Their later `OUTLINE_GENERATION_FAILED` state belongs to TASK-065 and
  confirms extraction itself completed.
