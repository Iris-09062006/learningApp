# TASK-064 — Repair Vercel PDF Extraction Packaging

## Status
`VERIFIED`

## Owner / Reviewer
Codex / Codex

## Objective
Restore production PDF text extraction after the Vercel release by ensuring the extraction Route
Handler ships the native Linux canvas runtime and runs on a stable supported Node.js major.

## Evidence
- Vercel deployment `dpl_CPwBcTWs4vEuEVpf1bMb6xfH7ANU` is `Ready`.
- Hosted source documents 20–22 fail with `EXTRACTION_FAILED` after the release.
- The exact source-22 PDF extracts successfully with the repository parser locally.
- The extraction route depends on the runtime-selected `@napi-rs/canvas` native binary.

## Required Context
- `next.config.ts`
- `package.json`
- `src/features/content-pipeline/extraction/document-extractor.ts`
- `src/features/content-pipeline/services/content-pipeline-service.ts`
- Next.js output file tracing and Vercel Node.js runtime contracts.

## Scope
- Explicitly trace the native canvas runtime and PDF parser files for the extraction route.
- Pin Vercel builds/functions to Node.js 22.x.
- Log a sanitized server-side extraction failure diagnostic without exposing document content,
  filenames, storage paths, credentials, or client-visible implementation details.
- Add regression coverage for the deployment configuration.
- Run required gates, publish the fix, redeploy production, and verify the failed PDF can extract.

## Out of Scope
- OCR or image-only PDF support.
- Database schema, RLS, AI generation, prompt, or curriculum behavior changes.
- Disabling Vercel deployment protection.

## Acceptance Criteria
- [x] Extraction route trace includes `pdf-parse`, `pdfjs-dist`, `@napi-rs/canvas`, and the Linux
  x64 GNU canvas binary package.
- [x] Vercel selects Node.js 22.x rather than the latest available major.
- [x] Runtime failures produce sanitized server logs while the API retains its generic response.
- [x] Focused and full quality gates pass with review `PASS`.
- [x] Fix is committed, pushed, deployed to production, and subsequent production PDFs extract
  successfully (sources 23 and 24 each persisted 2,392 extracted characters).

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `git diff --check`
