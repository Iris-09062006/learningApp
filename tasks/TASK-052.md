# TASK-052 - Fix Production PDF Extraction Runtime

## Status
`VERIFIED`

## Objective
Restore PDF text extraction in the Document-to-Lesson pipeline by ensuring the
native canvas dependency required by `pdf-parse` is initialized and included in
the Vercel Node.js function output.

## Scope
- Keep PDF extraction server-only and limited to the extraction operation.
- Initialize the Node canvas globals before loading `pdf-parse`.
- Make the native canvas dependency statically traceable by the Next.js build.
- Add a real text-layer PDF regression test.
- Preserve TXT, Markdown, DOCX, chunking, authorization, storage, and AI behavior.
- Update task state and implementation/test/review reports.

## Out of Scope
- OCR or support for image-only PDFs.
- AI provider, prompt, database, RLS, upload UI, or curriculum changes.
- Push, deployment, or production verification.

## Acceptance Criteria
- A valid PDF with a text layer is extracted successfully in the Node.js runtime.
- The parser is loaded only after required canvas globals exist.
- The production build traces the native canvas package for the extraction route.
- Existing content APIs do not eagerly initialize the PDF parser.
- `lint`, `typecheck`, `test`, `build`, `git diff --check`, and review pass.
- The verified task changes are committed with a Conventional Commit.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `git diff --check`

## Allowed Files
- `src/features/content-pipeline/extraction/document-extractor.ts`
- `src/features/content-pipeline/extraction/document-extractor.test.ts`
- `package.json`
- `package-lock.json`
- `next.config.ts` only if tracing evidence requires an explicit include rule
- `tasks/TASK-052.md`
- `reports/TASK-052-implementation.md`
- `reports/TASK-052-test.md`
- `reports/TASK-052-review.md`
- `ACTIVE_TASK.md`
- `project/TASKS.md`
