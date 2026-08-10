# TASK-050 Implementation Report

## Outcome

`VERIFIED`. The mixed destination controls were replaced by two explicit flows.
Production was not changed.

## Release

- Branch: `preview/task-050`
- Release commit: `6a1932d`
- Supabase project: `yzucdzlgaucmduoghjft` (Development)
- Migration: `20260810053252` (`020_separate_content_target_flows`)
- Vercel deployment: `dpl_DfQBMqJSS12vDuKQLSSa92v92NP6`
- Preview URL: `https://learning-glqzrannl-iris-projects-bcfa9d19.vercel.app`

## Implementation

- `Tạo course mới` asks only for the course name. The server derives the chapter
  and initial lesson title from the uploaded filename without its final extension.
- `Thêm vào course hiện có` lists courses and appends the source-named unpublished
  chapter/lesson to the selected course.
- Each destination mutation is atomic, active-Admin-only, audited, and returns the
  lesson target needed by generation.
- Removed the standalone course/chapter creator, shared chapter selector, and manual
  lesson-title field that mixed the two flows.
- Preserved the existing user-created course and chapter without modification.
- Deployed an exact Git-tree export so unrelated working-tree changes were excluded.
