# TASK-041 Implementation Report

## Outcome

`VERIFIED`. Preview env persistence, Supabase connectivity, Gemini compatibility, migration `017`, build, negative-auth smoke, authenticated role authorization and logs pass. Production was not changed by Codex.

## Completed preflight

- Locked release candidate to clean commit `a4880d8` while preserving the unrelated dirty working tree.
- Confirmed remote `main` (`931c895`) is an ancestor of the release candidate.
- Confirmed `origin` is `https://github.com/Iris-09062006/learningApp.git`.
- Confirmed Supabase project `yzucdzlgaucmduoghjft` is healthy and documented by TASK-015 as Development/non-Production.
- Checked the current Supabase changelog; identified no hosted-platform breaking change that blocks this Preview. The August 2026 Envoy change applies to self-hosting, not the hosted project.
- Confirmed Vercel CLI `49.1.2` is installed.

## Authorization recovery

The user approved the updated release payload, and `git push origin a4880d8:refs/heads/preview/task-041` succeeded. A read-only remote check confirmed the full SHA `a4880d8c0f2b548b344f461c91fd079b33477ff7`.

Git integration did not deploy because the Vercel project is connected to repository `learning_app`, while this repository's remote is `learningApp`. Direct CLI attempts from the clean worktree were rejected before build by Vercel's team collaboration rule for the commit author.

Codex first proved the original project could build from an exact-tree export. After the user created replacement project `learning-app` (`prj_KgoCcMGlZVBZzZjsDUKu2egbX0QZ`), Codex repeated the export/link flow and deployed only to Preview. Deployment `dpl_9fMoxUrSu5RUxY9BvKS5gYUqhs2r` reached `Ready`; the build completed in 45 seconds and emitted only webpack cache-performance warnings.

A protected runtime health request on the replacement project returned `database: unavailable`; the unauthenticated Admin endpoint correctly denied access. The first CLI sync exposed a Windows wrapper bug that appended CRLF to stdin values. Codex bypassed only that wrapper and used the same authenticated Vercel CLI entrypoint directly; a pull-back audit confirmed all eight Preview values are non-empty and newline-free.

The user replaced the service-role key and identified Gemini as the AI provider. Codex configured the official OpenAI-compatible chat-completions endpoint and `gemini-3.6-flash`; a harmless provider probe returned HTTP 200 with a completion. A read-only Supabase probe passed. All eight values were resynchronized through the direct Vercel Node entrypoint and audited non-empty/newline-free.

Deployment `dpl_DzH7cr8iR8pKqXdk7dLJcmXhRome` reached `Ready`; health returned `database: connected`, Admin access without a session was denied, the build completed in 31 seconds, and runtime error scanning was clean. Migration `017_add_distributed_rate_limits.sql` was then applied to Supabase Development. Metadata verification confirmed the private bucket table, RLS, least-privilege service-role grants, denied anon/authenticated RPC access, and security-invoker execution.

A service-role transaction smoke called `consume_rate_limit` twice with limit one, asserted allow then deny with a positive retry interval, and rolled back so no test bucket remained. Post-migration health stayed connected and the runtime warning/error/fatal scan remained empty.

## Authenticated role verification and cleanup

After explicit user authorization, Codex created three random disposable users on Supabase Development and assigned learner, moderator and admin roles. Each user signed in through the protected Preview's `/api/auth/login`; Vercel CLI supplied only the Preview-protection bypass while application sessions remained in per-role cookie jars inside a restricted temporary directory.

The learner received `200` for profile and `403` for moderation/Admin. The moderator received `200` for profile/moderation and `403` for Admin. The admin received `200` for all three. Cleanup ran in `finally`: each Preview session was logged out, each auth user was deleted, absence of all profile rows was verified, and the temporary directory was removed. No email, password, API key, cookie or token was printed or committed.

A final deployment-scoped runtime scan covering the authenticated requests found no warning, error or fatal records.
