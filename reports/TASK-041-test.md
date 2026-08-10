# TASK-041 Test Report

## Preflight evidence

| Check | Result |
|---|---|
| Release commit exists | PASS — `a4880d8c0f2b548b344f461c91fd079b33477ff7`. |
| Remote ancestry | PASS — remote `main` commit `931c895` is an ancestor. |
| Supabase separation | PASS — configured ref is TASK-015 Development project `yzucdzlgaucmduoghjft`. |
| Vercel CLI | PASS — version `49.1.2`. |
| Vercel authentication | PASS — CLI identifies `iris-09062006`. |
| Vercel team/project discovery | PASS — replacement project `iris-projects-bcfa9d19/learning-app` exists. |
| Vercel project link | PASS — linked only from isolated clean release material. |
| Push Preview branch | PASS — remote `preview/task-041` confirmed at `a4880d8`. |
| Preview deployment | PASS — deployment `dpl_DzH7cr8iR8pKqXdk7dLJcmXhRome` is `Ready`; exact commit tree was deployed without Production targeting. |
| Vercel build | PASS — Next.js build completed in 31 seconds; no build failure. |
| Preview environment persistence | PASS — eight values are non-empty and newline-free after bypassing the CRLF-producing Windows wrapper. |
| Supabase credential probe | PASS — read-only `limit(0)` query completed with the Development service-role key. |
| AI provider reachability | PASS — Gemini OpenAI-compatible endpoint returned HTTP 200 and a completion using `gemini-3.6-flash`. |
| Migration 017 | PASS — cloud migration history includes `add_distributed_rate_limits`; RLS/grants/RPC metadata match the reviewed migration. |
| Distributed rate-limit RPC | PASS — transaction smoke asserted allow then deny/retry under `service_role`; transaction rolled back. |
| System health | PASS — runtime returned `{ status: "ok", database: "connected" }`. |
| Unauthenticated admin guard | PASS — `/api/admin/users` returned `401 UNAUTHENTICATED`. |
| Build log review | PASS — build completed with no error event. |
| Runtime error log review | PASS — no warning/error/fatal records in the Preview deployment after authenticated role smoke. |
| Authenticated learner smoke | PASS — profile `200`, moderation `403`, Admin users `403`. |
| Authenticated moderator smoke | PASS — profile `200`, moderation `200`, Admin users `403`. |
| Authenticated admin smoke | PASS — profile `200`, moderation `200`, Admin users `200`. |
| Temporary identity cleanup | PASS — all sessions logged out, three auth users deleted, and profile rows confirmed absent. |

TASK-037/038 full gates remain recorded against the release candidate lineage (408 tests and production build pass). Preview deployment, environment, migration, health, authorization and cleanup gates all pass for TASK-041.

## Final local gates

| Command | Result |
|---|---|
| `npm run lint` | PASS — ESLint completed with zero warnings. |
| `npm run typecheck` | PASS — `tsc --noEmit`. |
| `npm test` | PASS — Vitest completed with exit code 0. The initial sandbox run could not spawn esbuild (`EPERM`); the approved rerun completed successfully. |
| `npm run build` | PASS — Next.js 15.5.22 production build completed and generated all 25 static pages. |
| `git diff --check` | PASS. |
