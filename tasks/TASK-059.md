# TASK-059 — Fix Gemini Structured-output Compatibility

## Status
`VERIFIED`

## Objective
Restore PDF → Course outline generation when the configured Gemini OpenAI-compatible endpoint
rejects unsupported JSON Schema validation keywords.

## Evidence
- Remote source document `14` extracted successfully: 14,395 characters across 4 chunks.
- Outline generation then marked the document failed.
- A synthetic request using the production model returned HTTP 400 with the current schema.
- The same structural schema returned HTTP 200 after removing validation-only keywords.

## Scope
- Use provider-compatible structural schemas for Course outline, Course draft, Lesson draft and
  Exercise generation.
- Keep all strict validation in existing server parsers/services.
- Preserve source data privacy and add regression tests.
- Run lint, typecheck, tests, build and diff review.

## Acceptance Criteria
- [x] Provider schemas contain no unsupported Gemini validation keywords.
- [x] Invalid provider output is still rejected by server validators.
- [x] Course outline and Exercise generation tests pass.
- [x] Required quality gates pass and review is PASS.
