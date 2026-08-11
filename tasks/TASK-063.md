# TASK-063 — Allow Learners to Advance to the Next Lesson

## Status
`VERIFIED`

## Owner / Reviewer
Codex / Codex

## Objective
Let a learner explicitly continue to the immediately following published Lesson without waiting
for completion of the current Lesson, while preserving truthful exercise-based completion data.

## Required Context
- `docs/features.md` (F-LESSON-02 and F-PROGRESS-02)
- `docs/api_contract.md` (Lesson detail and start contracts)
- `docs/database.md` (progress transitions and `start_lesson` RPC)
- `docs/security.md`
- `src/features/lessons/`
- `supabase/migrations/028_create_start_lesson_rpc.sql`

## Scope
- Return the immediately following published Lesson in Lesson detail even while it is locked.
- Render an accessible “Tiếp theo” action after Lesson content is visible.
- Start and navigate to that immediate next Lesson on demand.
- Permit `start_lesson` to advance only to the immediate published successor of an already
  accessible Lesson in the same enrolled Course.
- Keep the current Lesson `in_progress`; do not mark it `completed` or complete the Course.
- Add regression coverage and update the affected product/API/database contracts.

## Acceptance Criteria
- [x] A visible Lesson with a successor shows a “Tiếp theo” button.
- [x] Activating the button starts the successor, then navigates to it without a time gate.
- [x] Failure is announced and does not navigate.
- [x] A direct request cannot jump over a still-locked predecessor.
- [x] Skipping does not mark the current Lesson completed.
- [x] Required quality gates pass and review has no open Critical/High/Medium findings.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `git diff --check`
