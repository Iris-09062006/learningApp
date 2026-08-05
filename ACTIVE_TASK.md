# Active Task: TASK-030 (AI Exercise Generation)

## Status
`VERIFIED`

## Summary
- [x] Implement F-AIGEN-01 to generate new exercises using the AI Provider.
- [x] Build an internal generation service/API that accepts lesson context, type, difficulty, and objective.
- [x] Validate AI provider response against a strict schema (MVP exercise types only).
- [x] Save the generated draft to `generated_exercises` in a `pending` state (never auto-publish).
- [x] Cover prompt building, response validation, and secure execution with tests.
