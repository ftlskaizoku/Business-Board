# Security notes — Business Board

## What protects the data
- **Row-level security** on every table: a user only ever reads/writes rows of businesses they own (`owns_business()`).
- **Server actions** re-validate every input (amounts, quantities, ids, lengths, dates) and recompute prices from the database; nothing the browser sends about money is trusted.
- **Admin**: server-side gate (`requireAdmin`: confirmed admin email) + RLS read policies; privileged writes use the service-role key, which only exists in server env vars.
- **Headers**: clickjacking, sniffing, referrer, HSTS (see `next.config.ts`).

## One-time setup (Supabase dashboard — cannot be done from code)
1. Run `supabase/security-hardening.sql` in the SQL editor.
2. Authentication → Providers → Email: **Confirm email = ON** in production.
3. Authentication → Policies: minimum password length 8+, and enable leaked-password protection if your plan has it.
4. Authentication → URL Configuration: list only your real production URL(s) in Redirect URLs (no wildcards).
5. Authentication → Rate limits / CAPTCHA (Turnstile/hCaptcha) on sign-up and sign-in; turn on **MFA** for the admin account.
6. Vercel env: `SUPABASE_SERVICE_ROLE_KEY` is a *server* variable — never prefix it with `NEXT_PUBLIC_`. Rotate it if it was ever pasted anywhere.
7. Enable Supabase daily backups (Pro) or schedule a manual export.

## Known remaining items
- No nonce-based `script-src` CSP yet (Next inline scripts need a dedicated pass).
- Sale edits are not one database transaction (new lines are inserted before the old ones are removed, so nothing is lost, but a Postgres function would be fully atomic).
- No audit log / alerting on repeated failed logins (rely on Supabase rate limits).
- `npm audit` was not run; run it and keep Next.js/Supabase packages up to date.
