# TASK-060 Test Report

## Local quality gates

- Focused migration test — PASS, 1 file / 6 tests.
- `npm run lint` — PASS, zero warnings.
- `npm run typecheck` — PASS.
- `npm run test` — PASS.
- `npm run build` — PASS; 29 static pages generated and all dynamic routes compiled.
- `git diff --check` — PASS; line-ending notices only.

## Hosted Supabase verification

- PostgreSQL diagnostic reproduced `22P02` at function line 37 before the fix.
- Migration `20260811102054_fix_course_publish_markdown_json_precedence` — applied.
- Live function inspection — safe parenthesized JSON extraction present.
- Publish job #5 — PASS; Course 17 and Lesson IDs 4–9 returned.
- Atomic data check — PASS; one published Course, six published Lessons, six mappings,
  and all Lesson content begins with Markdown headings.
- Idempotent retry — PASS; returned Course 17 and Lesson IDs 4–9 without duplicates.
- Anonymous catalog/RLS check — PASS; Course 17, one Chapter, and six Lessons visible.
- Transactional learner E2E — PASS; enrollment initialized six progress rows, unlocked
  Lesson 4, and exposed its Markdown content. The test deliberately rolled back; the hosted
  project has no persistent learner profile, and no test enrollment/progress was retained.
