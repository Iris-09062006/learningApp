# TASK-036 — Accessible Fix-the-Bug Drag-and-Drop — Test Report

## Test Scope

- **Component tests (new)** — `src/features/exercises/components/__tests__/fix-the-bug-drag-drop.test.tsx` (8 tests):
  - Renders all code fragments as draggable buttons.
  - Selects an option on click and announces the selection.
  - Shows the selected option in the drop zone and removes it from the list.
  - Clears the selection via the `Gỡ bỏ` button.
  - Places an option into the drop zone on drop with a valid id.
  - Announces an invalid drop without changing the selection.
  - Sets drag data and announces the fragment when drag starts.
  - Shows an empty state when every option is placed.
- **Integration tests (new)** — `src/features/exercises/components/__tests__/exercise-view-fix-the-bug.test.tsx` (4 tests):
  - Renders the drag-and-drop component for `fix_the_bug` exercises.
  - Submits the selected option id only in the payload (`{ answer: { selectedOptionId: 1 } }`).
  - Disables the submit button until an option is selected.
  - Supports retry after an incorrect answer.

## Commands and Results

| Command | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run test` | PASS — 65 test files, 380/380 tests |
| `npm run test:e2e` | PASS — 5/5 |
| `npm run build` | PASS — compiled successfully, 22 routes |

## Coverage Notes

- Pointer-equivalent states (click select, remove, drop, invalid drop, drag start) covered via `fireEvent` with a fake `DataTransfer`.
- Keyboard flow is covered through the same button interactions that are keyboard-accessible (native `<button>` elements); no pointer-only pathway exists.
- Retry and submission payload verified at the integration layer.
- Announcement texts verified against the `aria-live` announcer node.
- Full suite baseline (368 tests before this task) preserved; 12 tests added, all existing tests unaffected.