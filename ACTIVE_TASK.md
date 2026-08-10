# Active Task Queue

- **Active task:** `TASK-044` — Fix Supabase Auth Email Redirects on Preview
- **Status:** `BLOCKED`
- **Owner:** Codex
- **Previous task:** `TASK-043` — Document-to-Lesson Content Pipeline (`VERIFIED`)

## Current objective

Stop signup-confirmation and password-recovery emails from redirecting Preview users
to `localhost:3000`, then publish and verify a clean Preview hotfix.

## Current state

Code commit `59b8318` is pushed and Preview deployment
`dpl_GcaLxar1dmrsobKc5Yabrtcgftbb` is `READY` with database health connected. Final
email-link verification is blocked until Supabase Redirect URLs contains
`https://*-iris-projects-bcfa9d19.vercel.app/**` and a fresh confirmation email is
generated. Production is untouched.
