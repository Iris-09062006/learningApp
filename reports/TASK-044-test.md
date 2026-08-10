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

## Pending runtime evidence
- New Vercel Preview reaches `READY`.
- Supabase health remains connected.
- A newly generated confirmation email uses the Preview origin; old OTP links are
  single-use/expiring and cannot validate this fix.

