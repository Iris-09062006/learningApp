# TASK-036 — Accessible Fix-the-Bug Drag-and-Drop — Review Report

## Verdict

**PASS** — no Critical, High, or Medium findings. Required quality gates all pass.

## Review Checklist

### Scope

- Only in-scope content changed: `fixTheBug` drag-and-drop UI, integration branch, and tests. No `selectedSyntax`, database, or exercise-type changes. ✅
- Out-of-scope items untouched. ✅

### Correctness

- `FixTheBugDragDrop` maps the chosen fragment to `selectedOptionId`; parent submits `{ answer: { selectedOptionId } }`. ✅
- Drop with unknown id is rejected and announced; selection unchanged. ✅
- Select, clear, drag start, drop, and invalid drop states verified by unit tests. ✅
- Retry flow (`Nộp lại` after incorrect answer) covered. ✅

### Architecture

- New component lives with existing exercise components (`src/features/exercises/components/`). ✅
- Server-side grading and submission contract from `TASK-026` unchanged. ✅
- Existing radio/select fallback preserved for non-`fix_the_bug` types. ✅

### API / Database / Security

- No new API, database, or contract changes. No solution exposure; client sends only `selectedOptionId`. ✅

### UI / Accessibility

- Real buttons with `aria-label` for screen readers; no pointer-only dependency. ✅
- `aria-live="polite"` region announces selection, drag, drop, invalid drop, removal, and empty state. ✅
- Focus-visible rings on interactive elements; `Gỡ bỏ` returns focus to the options list. ✅
- Submit loading, feedback, and retry announced by parent `ExerciseView` (`role="status"` / `role="alert"`). ✅

### Tests

- 8 component tests + 4 integration tests added; all pass. Full suite: 380/380.
- `git diff --check` clean (only CRLF normalization warnings, no trailing whitespace).

## Findings Resolved

| Severity | Finding | Resolution |
|---|---|---|
| Low | Duplicate text match in `exercise-view-fix-the-bug.test.tsx` caused `findByText("Chính xác!")` to hit two nodes | Feedback text made distinct; assertion updated to target the unique feedback string |

## Acceptance Criteria Verification

| Criterion | Status |
|---|---|
| Mouse/touch and keyboard users can complete the same interaction | ✅ buttons + drag enhancement + clear/retry controls |
| Client submits only `selectedOptionId`; grading remains server-side | ✅ payload test asserts `{ answer: { selectedOptionId: 1 } }` |
| Drag state, invalid drop, submit loading, feedback and retry are announced accessibly | ✅ aria-live announcer + parent role="status"/"alert" |
| Predict-output behavior does not regress | ✅ existing radio path and full suite pass |

## Remaining Limitations

- No new e2e spec for the drag interaction; component-level coverage is used because the exercise flow requires an authenticated seeded environment (consistent with previous exercise tasks).
- Screen-reader announcements are unit-verified via the announcer node rather than with a real screen reader.