# TASK-051 Implementation Report

## Outcome

`VERIFIED`. GitHub `main` contains the verified release and deterministic
clean-install fix. GitHub Actions passes, and the corrected commit is live on
Vercel Production with healthy Supabase connectivity and functioning distributed
login rate limiting.

## CI fix

- Reproduced run `31361233448`, job `93370375837`: `npm ci` reported missing
  `@emnapi/core@1.11.3` and `@emnapi/runtime@1.11.3` lock entries.
- Added both pinned packages as direct dev dependencies and made overrides reference
  their direct dependency specs.
- Regenerated `package-lock.json`; `npm ci` now succeeds from a clean dependency
  tree with zero reported vulnerabilities.
- Aligned GitHub Actions with Node.js 24 and raised the supported project minimum to
  Node.js 22, matching current Supabase package requirements.

## Release evidence

- Published application commit: `d565586`
- Initial production deployment: `dpl_6iY8Umb5Cv1QqTAVt7AeH6zHNKCj`
- Corrected release commit: `5389039`
- GitHub Actions run: `31362387357`
- Final production deployment: `dpl_EWaxn3whDXbWXKeLhz9bzz2kChnw`
- Production URL: `https://learing-app1.vercel.app`
- Status: `READY`; database health: `ok / connected`

## Production credential and rate-limit correction

- Supabase MCP confirmed the sole connected project is active and healthy, the
  `profiles` table exists, and `service_role` has SELECT privilege.
- Supabase API logs showed Production health and `consume_rate_limit` calls failing
  with `401`, proving the Vercel service-role credential was invalid.
- Replaced only the Vercel Production `SUPABASE_SERVICE_ROLE_KEY` using a locally
  validated key passed through stdin; the secret was never printed or committed.
- Redeployed the same verified Git tree. Health now reports connected, an invalid
  login returns `401 UNAUTHENTICATED`, and the limiter RPC returns `200`.
- Preserved the contract limit of 10 login requests per IP per 10 minutes.

## Scope protection

Existing user changes in `AGENTS.md`, `docs/decisions.md`, and untracked probe files
remain unstaged and outside this task.
