# TASK-048 — Deploy Navigation and AI Pipeline Hotfix to Current Preview

## Status
`IN_PROGRESS`

## Objective
Deploy verified TASK-045/TASK-046 changes to the existing LearningApp Preview and its
Supabase Development project without changing Production.

## Scope
- Run required deterministic E2E and release preflight.
- Apply migration `018_create_lesson_content_target.sql` to Supabase Development.
- Verify function ACL, Admin guard, migration history, and advisors.
- Push an exact release commit to a preview branch.
- Deploy the linked Vercel project to Preview and verify health, public routes, API
  authentication behavior, build status, and runtime errors.
- Record deployment evidence and commits.

## Out of Scope
- Production promotion or production database changes.
- Supabase Auth Redirect URL dashboard changes from TASK-044.
- UI redesign from TASK-047.

## Acceptance Criteria
- All required local gates pass on the release commit.
- Migration 018 exists exactly once on the Development database and its RPC is not
  executable by `anon` or `PUBLIC`.
- Preview deployment reaches `READY`, health reports database connected, and public
  navigation/API negative-auth smoke passes.
- Runtime error scan is clean or all findings are documented and resolved.
