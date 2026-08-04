# ACTIVE TASK — TASK-026

**Task ID:** TASK-026
**Title:** Exercise API, Evaluation, and Submissions
**Status:** `VERIFIED`
**Assigned Agent:** Codex (Solo Agent)

## Objectives
1. Implement types for exercise data structures (`GetExerciseResponse`, `SubmitExerciseRequest`, `SubmitExerciseResponse`, `SubmissionSummary`).
2. Add `exercise-repository.ts` in `src/features/exercises/repositories/` to handle secure solution retrieval (server-side ONLY) and submission persistence.
3. Add `exercise-service.ts` in `src/features/exercises/services/` to perform answer validation, grade submissions (`predictOutput` & `fixTheBug`), update lesson completion status when required exercises pass, and auto-unlock next lesson.
4. Implement API Route Handlers:
   - `GET /api/exercises/:exerciseId`
   - `POST /api/exercises/:exerciseId/submissions`
   - `GET /api/exercises/:exerciseId/submissions`
5. Build client component `ExerciseView` supporting `predictOutput` and `fixTheBug` choice selection, submission feedback banner, and next-lesson progression trigger.
6. Write complete unit tests for repository, evaluation logic, API handlers, and UI components.

## Quality Gates Status
- `lint`: PASS
- `typecheck`: PASS
- `test`: PASS (27 test files, 168 tests)
- `build`: PASS
- `review`: PASS (VERIFIED)