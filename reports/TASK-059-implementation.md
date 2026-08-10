# TASK-059 Implementation Report

## Outcome

Fixed Course/Lesson/Exercise structured-output requests rejected by the configured Gemini
OpenAI-compatible endpoint.

## Root cause

The provider accepts structural JSON Schema fields but returned HTTP 400 `INVALID_ARGUMENT` when
schemas included validation keywords such as length, item-count, uniqueness and numeric ranges.
The uploaded PDF itself was healthy: extraction produced 14,395 characters and four chunks.

## Change

- Provider-facing schemas now contain only type, required fields, properties, item types and
  `additionalProperties: false`.
- Existing parsers/services still enforce length, cardinality, uniqueness, ranges, citations,
  allowed chunk indexes and all Exercise answer rules.
- No document content was included in diagnostic output or committed.
