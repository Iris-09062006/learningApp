# TASK-041 — Preview Deployment and Smoke Verification

## Status
`VERIFIED`

## Phase
Phase 7

## Objective
Triển khai release candidate lên Preview và chạy smoke/security checks trên môi trường đó trước khi đề xuất Production.

## Dependencies and Authorization Gate
- `TASK-040` verified.
- Người dùng đã yêu cầu tiếp tục TASK-041 trong turn hiện tại, cho phép push/deploy Preview nhưng không cho phép Production.
- Supabase Development project `yzucdzlgaucmduoghjft` là resource non-Production đã được xác nhận trong TASK-015.
- Vercel project/link và least-privilege credentials phải được discovery trước khi deploy trực tiếp.

Release candidate được khóa tại commit `a4880d8`; working tree bẩn không được upload trực tiếp.

## Planned Scope
- Preflight branch/diff/secret/migration review.
- Push đúng branch và tạo Preview deployment theo workflow được phê duyệt.
- Xác minh environment separation và không dùng Production DB.
- Chạy smoke flows, health check và log review trên Preview.
- Ghi deployment URL/id, evidence và rollback path vào report.

## Out of Scope
- Production deployment hoặc promote traffic.
- Production migration.
- Bỏ qua failed gate để tạo Preview.

## Acceptance Criteria
- Mọi gate `TASK-040` vẫn pass trên release commit.
- Preview kết nối đúng staging resources; secrets không xuất hiện ở client/log/report.
- Critical smoke tests và rollback rehearsal/document review pass.
- Production vẫn ở trạng thái chưa deploy cho đến yêu cầu riêng.

## Required Commands
- `git push origin a4880d8:refs/heads/preview/task-041`
- GitHub quality-gate/E2E checks trên branch Preview hoặc full gates trong isolated checkout của cùng commit.
- `vercel inspect <preview-url> --wait` khi project credentials khả dụng.
- `vercel curl /api/system/health --deployment <preview-url>` và role-specific smoke checks.
- `vercel logs <preview-url>` để rà lỗi sau smoke.

## Files allowed to change
- `tasks/TASK-041.md`, `ACTIVE_TASK.md`, `project/TASKS.md`
- `reports/TASK-041-implementation.md`, `reports/TASK-041-test.md`, `reports/TASK-041-review.md`

## Verification outcome
- Remote branch `preview/task-041` contains release candidate `a4880d8c0f2b548b344f461c91fd079b33477ff7`; the final verification-report commit advances that branch without changing the deployed application tree.
- Replacement Vercel project `learning-app` (`prj_KgoCcMGlZVBZzZjsDUKu2egbX0QZ`) was created by the user. Its Git integration is still connected to repository `learning_app`, not this repository's `learningApp`, so the release branch push cannot deploy automatically.
- The latest exact-tree Preview `dpl_DzH7cr8iR8pKqXdk7dLJcmXhRome` is `Ready` at `https://learning-ki1nbg4xw-iris-projects-bcfa9d19.vercel.app`.
- Vercel's Windows PowerShell wrapper was found to append CRLF to stdin values. Calling the Vercel Node entrypoint directly repaired all eight Preview values; a pull-back audit confirmed they are non-empty and newline-free.
- Preview env now contains eight non-empty, newline-free values. Supabase service-role validation and runtime health both pass (`database: connected`).
- Gemini OpenAI-compatible endpoint `generativelanguage.googleapis.com` with `gemini-3.6-flash` returned HTTP 200 and a completion; no response content or key was logged.
- Migration `017_add_distributed_rate_limits.sql` was applied to Development and verified: private table exists, RLS is enabled, service-role table/RPC access passes, anon/authenticated RPC execution is denied, and the RPC is security-invoker.
- A transaction-rolled-back service-role smoke verified first-request allow and second-request deny/retry behavior without leaving a test bucket.
- Build completed in 31 seconds, unauthenticated Admin access is denied, and no Preview runtime warning/error/fatal log was found.
- Supabase advisors report INFO findings plus WARN findings for pre-existing SECURITY DEFINER RPCs and leaked-password protection. The RPC warnings were reviewed against source and contain explicit `auth.uid()`, active-profile and role/ownership guards; they are not introduced by migration 017.
- The user explicitly authorized three disposable Development smoke accounts. Learner, moderator and admin sessions were created through the Preview login API and exercised against profile, moderation and Admin APIs.
- All nine role assertions passed: learner received `200/403/403`, moderator `200/200/403`, and admin `200/200/200` for profile/moderation/Admin respectively.
- Every temporary session was logged out, all three auth users were deleted, and absence of their profile rows was verified. No credentials or session tokens were printed or retained.
- Review verdict is `PASS`; Production remains untouched.
