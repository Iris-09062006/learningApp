# TASK-052 Test Report

## Quality gates

- `npm run lint` - PASS, zero warnings.
- `npm run typecheck` - PASS.
- `npm run test` - PASS, 79 files and 439 tests.
- `npm run build` - PASS, Next.js 15.5.22 production build.
- `git diff --check` - PASS; only existing CRLF conversion notices were printed.

## Focused regression

- Extractor plus lazy-loading suites - PASS, 2 files and 11 tests.
- The new PDF test parses a deterministic PDF 1.4 document with a real text layer
  and verifies both expected text lines.
- Existing TXT/Markdown normalization, empty-document rejection, and chunk bounds
  remain green.

## Build trace

The extraction route trace contains:

- `CANVAS_PACKAGE_FILES=5`
- `CANVAS_NATIVE_BINARIES=1`
- `PDF_PARSE_FILES=20`

Trace assertion verdict: `EXTRACTION_TRACE_PASS`.

Expected stderr from tests that intentionally exercise error responses remained
present; no test failed.
