# TASK-036 — Accessible Fix-the-Bug Drag-and-Drop — Implementation Report

## Outcome

TASK-036 implemented, tested, and review PASS. All quality gates pass.

## Status Final

`VERIFIED`

## Objective Recap

Add drag-and-drop interaction for `fix_the_bug` exercises while keeping server-side grading and the existing `selectedOptionId` submission payload.

## Files Changed

- `src/features/exercises/components/fix-the-bug-drag-drop.tsx` (new) — accessible drag-and-drop picker for code fragments.
- `src/features/exercises/components/exercise-view.tsx` (modified) — renders `FixTheBugDragDrop` for `fix_the_bug` exercises; existing radio list preserved for other types.
- `src/features/exercises/components/__tests__/fix-the-bug-drag-drop.test.tsx` (new) — 8 unit tests for the component.
- `src/features/exercises/components/__tests__/exercise-view-fix-the-bug.test.tsx` (new) — 4 unit tests for the integration branch and submission payload.
- `tasks/TASK-036.md` — status `IN_PROGRESS` → `VERIFIED`.
- `project/TASKS.md` — Active Task line, ready queue, and verified list updated.
- `ACTIVE_TASK.md` — last verified task updated to `TASK-036`.

## Key Decisions

1. **Payload unchanged**: the component converts the chosen fragment to `selectedOptionId` only. Grading stays fully server-side per the existing submission contract.
2. **Accessibility-first interaction**: each code fragment is rendered as a real `<button>` so pointer/touch and keyboard users complete the same flow; drag is an enhancement (`draggable` + `onDragStart`), not a requirement.
3. **Announcements**: a visually hidden `aria-live="polite"` region announces selection, drag start, drop, invalid drop, and removal. Submit loading, feedback, and retry remain announced by the parent `ExerciseView`.
4. **Invalid drop handling**: drops with unknown ids announce an error and do not mutate the selection.
5. **Fallback preserved**: non-`fix_the_bug` types keep the existing radio/select UI path; drag APIs are never required.

## Quality Gates

| Gate | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 65 files, 380 tests (12 new tests added) |
| `npm run test:e2e` | PASS — 5/5 |
| `npm run build` | PASS — 22 routes |

## Review Verdict

PASS — no Critical/High/Medium findings. One Low (duplicate text match in a test assertion) fixed during test run.

## Commit

Pending — feature and status artifacts will be committed separately.