# Active Task Queue

- **Active task:** `TASK-044` — Fix Supabase Auth Email Redirects on Preview
- **Status:** `READY_FOR_REVIEW`
- **Owner:** Codex
- **Previous task:** `TASK-043` — Document-to-Lesson Content Pipeline (`VERIFIED`)

## Current objective

Stop signup-confirmation and password-recovery emails from redirecting Preview users
to `localhost:3000`, then publish and verify a clean Preview hotfix.

## Current state

The code fix and local gates pass. A clean Preview deployment and live confirmation
link check remain; Supabase Redirect URLs may require the documented wildcard entry.
Production is untouched.
