# TASK-065 Implementation Report

## Outcome

Implemented one bounded correction retry for Course-outline responses that return successfully from
the provider but fail JSON parsing or strict server-side outline validation. The retry makes a
fresh request and explicitly requires 2–20 Lessons, unique stable keys, non-empty Course/Lesson
objectives, and valid integer source references.

For exercise-oriented documents, the correction prompt permits inferring teachable concepts and
prerequisite knowledge while continuing to prohibit copying questions, tasks, answers, solutions,
or Lesson body content.

HTTP failures, timeouts, missing provider configuration, authentication, rate limits, persistence,
and the generic client error contract are unchanged. Retry logging contains only the attempt number
and a fixed internal error code. Before the second provider request, the service consumes a second
Course-outline quota unit so the existing 20 provider-calls/Admin/hour contract remains accurate.

## Files changed

- `src/features/content-pipeline/providers/lesson-draft-provider.ts`
- `src/features/content-pipeline/providers/lesson-draft-provider.test.ts`
- `src/features/content-pipeline/services/content-pipeline-service.ts` and its regression test.
- TASK-064 verification and TASK-065 workflow artifacts.

## Deployment

Pending push and production deployment after the reviewed commit.
