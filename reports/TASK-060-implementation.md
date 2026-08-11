# TASK-060 Implementation Report

## Outcome

PostgreSQL `22P02` during Course publication is fixed on the hosted Supabase project.
Course import job #5 published Course 17, one Chapter, and six Lessons atomically.

## Root cause and fix

The live function matched migration 025. The failure came from PostgreSQL operator
resolution in `'## ' || section->>'heading'`: it attempted to resolve JSON concatenation
and parse the Markdown prefix as JSON. Both JSON extractions are now parenthesized before
text concatenation.

- Corrected migration 025 for clean database replays.
- Added forward-only migration 027 for already-migrated databases.
- Applied hosted migration `20260811102054` through Supabase MCP.
- Added a regression assertion for the safe Markdown expression.

## Hosted result

- Job: 5 (`published`)
- Course: 17 (`is_published=true`)
- Lessons: 4–9 (six published Lessons)
- Publication mappings: six
- Idempotent retry returned the same Course and Lesson IDs.
