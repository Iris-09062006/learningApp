# TASK-062 — Reveal and Redesign the Lesson Learning Experience

## Status
`VERIFIED`

## Owner / Reviewer
Codex / Codex

## Objective
Make a successful `POST /api/lessons/:lessonId/start` produce an immediate, visible transition
into the Lesson content, render published Markdown as structured learning material, and improve the
Lesson page's responsive visual hierarchy and accessibility.

## Required Context
- `docs/features.md` (F-LESSON-01 and F-LESSON-02)
- `docs/api_contract.md` (Lesson detail and start contracts)
- `docs/ui.md` (learner-facing UI and accessibility guidance)
- `src/app/(main)/lessons/[lessonId]/page.tsx`
- `src/features/lessons/components/lesson-content-view.tsx`
- `src/features/lessons/components/__tests__/lesson-content-view.test.tsx`

## Scope
- Keep Lesson content behind a clear start state for an unlocked Lesson.
- Use the successful start response to update client state and reveal content immediately.
- Render trusted text as safe Markdown-like React elements without raw HTML injection.
- Redesign the page with a focused reading column, visible status/progress cues, responsive layout,
  accessible feedback, and polished empty/exercise states.
- Add regression coverage for the start-to-content transition and Markdown rendering.
- Preserve the API, database, authorization, and progress contracts.

## Acceptance Criteria
- [x] An unlocked Lesson initially presents a clear start action and does not show the body.
- [x] A successful start request changes the visible status and reveals the Lesson body without
      depending on a server refresh.
- [x] In-progress and completed Lessons show their content immediately.
- [x] Markdown headings, lists, emphasis, links, inline code, and fenced code render as structured,
      safe React content.
- [x] Loading, error, empty, mobile, keyboard, focus, and reduced-motion states remain usable.
- [x] Focused tests and all required quality gates pass; review has no open findings.

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- `git diff --check`
