# TASK-053 Implementation Report

## Outcome

`VERIFIED`. Document-to-Lesson can now resolve an extracted source document and an
unpublished target lesson locally after the service authorizes an active Admin.

## Root cause

The target lesson existed, but the repository queried it with the Admin session.
Current curriculum RLS exposes only fully published courses, chapters, and lessons,
so Supabase returned no row and the service reported `Source document or target
lesson not found.`

## Changes

- Read generation context and Admin curriculum lists through the existing
  server-only Supabase Admin client after `requireAdmin()` authorization.
- Added migration `021` with SELECT-only active-Admin policies for courses,
  chapters, and lessons.
- Preserved anonymous, learner, inactive-Admin, published-content, and curriculum
  write boundaries.
- Added repository and migration regression tests.

## Runtime evidence

A read-only probe against the configured Supabase data resolved source document
`5` (`extracted`, one chunk) and unpublished lesson `1` in chapter `2`, course `2`.

## Release scope

After explicit user authorization, migration `021_allow_active_admins_read_curriculum`
was applied through Supabase MCP to project `yzucdzlgaucmduoghjft`. No application
push, Vercel deployment, or environment update was performed.
