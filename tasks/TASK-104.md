# TASK-104: User Profile Management

## Status: READY
## Phase: Phase 1 — Core Authentication & User Management
## Priority: Medium
## Assignee: —

## Objective

Xây dựng trang profile cho user: xem và chỉnh sửa thông tin cá nhân (tên, avatar, lớp học).

## Scope

### Trong scope
- Trang `/profile` hiển thị thông tin user
- Form chỉnh sửa profile (full_name, grade_level, avatar_url)
- Server Action cập nhật profile
- Avatar upload (Supabase Storage) — basic implementation
- Validation cho profile fields
- Success/error feedback

### Ngoài scope
- Change password
- Delete account
- Email change
- Advanced avatar cropping/editing

## Dependencies
- TASK-102: Auth Logic ✅
- TASK-103: Route Protection ✅

## Required Context
- `docs/requirements.md` §2.1 — Profile management
- `docs/database.md` — profiles table
- `src/generated/db-types.ts` — Profile types
- `src/shared/constants/app.ts` — Grade level constants

## Acceptance Criteria
- [ ] Trang `/profile` hiển thị thông tin user hiện tại
- [ ] Form edit profile hoạt động (full_name, grade_level)
- [ ] Avatar upload hoạt động (basic)
- [ ] Validation: grade_level 1-12, full_name required
- [ ] Success message sau khi update
- [ ] Error handling cho failed updates
- [ ] Lint, typecheck, build pass
- [ ] Tests cho profile components và actions

## Technical Notes
- Profile page tại `src/app/(dashboard)/profile/page.tsx`
- Server Actions tại `src/features/auth/actions/profile.ts`
- Components tại `src/features/auth/components/ProfileForm.tsx`
- Dùng Supabase Storage cho avatar upload
- RLS policies đã có cho profiles table

## Files Expected to Change
- `src/app/(dashboard)/profile/page.tsx`
- `src/features/auth/actions/profile.ts`
- `src/features/auth/components/ProfileForm.tsx`
- `src/features/auth/components/AvatarUpload.tsx`
- Tests

## Required Commands
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test`