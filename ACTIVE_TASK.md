# Active Task: TASK-031 (Content Moderation API and Moderation Queue)

- **Task ID**: TASK-031
- **Task Name**: Content Moderation API and Moderation Queue
- **Status**: `VERIFIED`
- **Owner**: Codex

## Objectives
- [x] Implement moderation queue API (`GET /api/moderation/generated-exercises`) for Moderators and Admins.
- [x] Implement exercise review API (`POST /api/moderation/generated-exercises/:id/reviews`) supporting `approved`, `rejected`, and `needs_revision` statuses with audit trailing in `admin_logs`.
- [x] Implement publishing logic (`POST /api/moderation/generated-exercises/:id/publish`) to safely convert an approved generated exercise into a published `exercise` record with options and solutions in a single transaction.
- [x] Build a Moderator/Admin facing dashboard UI (`/moderation` and `/moderation/[id]`) for reviewing and publishing AI-generated exercises.
- [x] Cover access control (rejecting Learners/Guests with 403), transactional safety, and UI states with unit/integration tests.

## Required Context & Scope
- **Domain**: Content Moderation & Administration (`src/features/moderation`)
- **API Specs**:
  - `GET /api/moderation/generated-exercises`
  - `GET /api/moderation/generated-exercises/:id`
  - `POST /api/moderation/generated-exercises/:id/reviews`
  - `POST /api/moderation/generated-exercises/:id/publish`
- **Database Migrations**:
  - `011_create_admin_logs.sql`
  - `012_create_operations_indexes_and_rls.sql`
  - `013_create_operations_rpc_functions.sql`

## Verification & Quality Gates
- `npm run lint`: PASSED (0 errors)
- `npm run typecheck`: PASSED (0 errors)
- `npm run test`: PASSED (286/286 passing)
- `npm run build`: PASSED (Next.js production build cleanly generated)
- Review report: `reports/TASK-031-review.md` (Verdict: PASS)
- Implementation report: `reports/TASK-031-implementation.md`