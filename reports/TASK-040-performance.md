# TASK-040 Performance Report

## Method and environment

- Tool: `next build` from Next.js `15.5.22`, production mode.
- Host: local Windows workspace, Node.js project with the existing `.env.local`.
- Database latency was not used as a benchmark because it depends on an external Supabase environment. Request improvements are reported as deterministic service/network-operation counts instead.
- Before build: exit 0, 20.1 s wall clock, compiled in 2.3 s. After build: exit 0, 22.6 s wall clock, compiled in 3.6 s. Single-run build time is recorded but not treated as a regression/improvement signal.

## Budgets

- Shared First Load JS: at most 120 kB.
- Representative route First Load JS: at most 150 kB.
- Documented browser-SDK exception: at most 200 kB and isolated to its route.

## Route bundle baseline

| Representative surface | Route | Before | After | Budget | Result |
|---|---|---:|---:|---:|---|
| Landing | `/` | 106 kB | 106 kB | 150 kB | PASS |
| Catalog | `/courses` | 106 kB | 106 kB | 150 kB | PASS |
| Roadmap | `/courses/[courseId]/roadmap` | 108 kB | 108 kB | 150 kB | PASS |
| Lesson | `/lessons/[lessonId]` | 108 kB | 108 kB | 150 kB | PASS |
| Learner dashboard | `/dashboard` | 107 kB | 107 kB | 150 kB | PASS |
| Moderation queue | `/moderation` | 109 kB | 109 kB | 150 kB | PASS |
| Admin system | `/admin/system` | 114 kB | 114 kB | 150 kB | PASS |
| Admin users | `/admin/users` | 116 kB | 116 kB | 150 kB | PASS |
| Admin content | `/admin/content` | 113 kB | 113 kB | 150 kB | PASS |
| Shared JS | all routes | 103 kB | 103 kB | 120 kB | PASS |

`/reset-password` is 183 kB First Load JS because password recovery requires the Supabase browser auth SDK. The SDK remains isolated to that route and is below the documented 200 kB exception; it is not part of the representative release surfaces above.

## Request and query audit

| Flow | Before | After | Evidence |
|---|---:|---:|---|
| Course detail metadata + page, authenticated | up to 8 Supabase/auth operations | up to 4 | Both consumers now share `cache(getCourseById)`; regression test asserts one loader call. |
| Roadmap metadata + page, authenticated with lessons/progress | up to 12 Supabase/auth operations | up to 6 | Both consumers now share `cache(getCourseRoadmap)`; regression test asserts one loader call. |

The operation counts follow the repository call graph. Actual counts can be lower on early not-found/unauthenticated exits. React request memoization does not create cross-user or persistent caching.

Additional audit:

- Catalog, Admin users and Moderation queue enforce bounded database pagination (maximum 100 where applicable).
- Roadmap batches lessons and progress with `.in(...)`; dashboard batches enrollments/courses/chapters/lessons/progress. No per-row database query loop was found.
- Independent dashboard profile/enrollment and course/chapter reads already use `Promise.all`.
- Moderation performs its initial queue read after hydration. This is a known client waterfall, but the route remains within budget and changing its ownership/auth rendering model was not justified by measured evidence in this task.

## Verdict

PASS. All defined bundle budgets pass, two duplicated request chains were reduced by 50%, and no evidenced bundle or N+1 regression remains.
