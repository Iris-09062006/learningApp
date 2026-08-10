# TASK-049 — Bootstrap Empty Content Curriculum

## Status
`VERIFIED`

## Objective
Remove the Document-to-Lesson dead end when Supabase has no courses or chapters by
allowing an active Admin to create an unpublished course and its first unpublished
chapter from the content pipeline, then continue creating the target lesson.

## Scope
- Add an Admin-only transactional RPC for a new course plus first chapter.
- Add a server API/service/repository path with strict title and slug validation.
- Show an explicit empty state and inline course/chapter creation controls.
- Automatically select the new chapter after creation without uploading the source
  document prematurely.
- Add regression coverage, apply the migration to Supabase Development, and deploy
  the verified change to the existing Vercel Preview.

## Out of Scope
- Full course-builder UI or broad curriculum CRUD.
- Editing/deleting/reordering existing courses or chapters.
- UI redesign from TASK-047.
- Production database or Production deployment.

## Acceptance Criteria
- An empty database no longer leaves Admin with a blank chapter select and no action.
- Course and chapter titles are validated server-side; both records are unpublished.
- The mutation requires an active Admin and writes an audit log.
- The created chapter is selected immediately and the existing upload/generate flow
  can continue.
- Local quality gates, Development database verification, Preview smoke, and review
  pass.
