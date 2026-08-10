# TASK-044 Test Report

## Commands and results
- `npm run test -- src/features/auth/auth.service.test.ts` — PASS, 12/12 tests.
- `npm run lint` — PASS, zero warnings.
- `npm run typecheck` — PASS.
- `npm run test` — PASS.
- `npm run build` — PASS, 25 static pages generated and all dynamic routes built.
- `git diff --check` — PASS.

## Coverage
- Preview uses `VERCEL_URL` even when a configured site URL exists.
- Non-Preview environments prefer `NEXT_PUBLIC_SITE_URL`.
- Local development falls back to `http://localhost:3000`.
- Password recovery shares the Preview resolver and preserves `/reset-password`.

## Runtime evidence
- Vercel Preview `dpl_GcaLxar1dmrsobKc5Yabrtcgftbb` — `READY`.
- `/api/system/health` — PASS, `database: connected`.
- Deployment warning/error/fatal scan — clean.
- Live confirmation email — BLOCKED pending Supabase Redirect URLs verification and
  a newly generated link; old OTP links are single-use/expiring.
