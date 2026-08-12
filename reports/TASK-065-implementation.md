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

- Commit `ea98bb4` was pushed to `origin/main`.
- Vercel production deployment `dpl_HebK3MAWR9dsYTA9MZnoRi4CmM4K` completed with status `Ready`.
- Production URL: `https://learning-cvero0ew0-iris-projects-bcfa9d19.vercel.app`.
- Authenticated retry of the affected production source remains the final verification checkpoint.

## Production follow-up

Sources 25 and 26 reproduced the outline failure after the initial retry deployment. Both sources
still extracted 2,392 characters and contained one server-owned chunk. The provider parser now
canonicalizes non-empty integer citations to that sole chunk, covering provider 1-based and
duplicate indexes without broadening citation ownership. Multi-chunk documents still reject every
out-of-range citation. The correction prompt now also states the exact sole-chunk `[0]` convention.
