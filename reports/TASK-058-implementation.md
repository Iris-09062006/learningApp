# TASK-058 Implementation Report

## Outcome

Implemented the independent Published Lesson → Exercise draft → moderation → publish pipeline.

## Delivered

- Added migration `026_lesson_to_exercise_pipeline.sql` with authorized Lesson context, strict
  draft creation, atomic review/edit, and atomic idempotent publication RPCs.
- Removed direct authenticated draft/review mutations and retained Moderator/Admin read access.
- Added strict provider/service validation, structured output, prompt-injection framing and a
  45-second provider timeout.
- Added `/moderation/lessons` and a Lesson-fixed generation form; removed Exercise controls from
  the PDF/Course pipeline.
- Added structured moderation editing, immutable review history and approved-only publish UX.
- Publication creates ordered options and stores the real correct option ID server-side.

## Rollout limitation

Migration `026` was added and statically verified but was not applied to a shared Supabase project.
No push or deployment was performed.
