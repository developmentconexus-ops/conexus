# 0013. Who holds the Hub's session

## Context

The founder requires three guarantees of the Hub's session: no stored row works alone to sign in; the cookie is valid for one exact host; there is an idle and a total deadline. On 2026-10-13 he asked why Conexus keeps a session when Better Auth manages one; it was reopened.

## Decision

Open. The three guarantees are requirements, whatever holds the session. App sessions, the handoff to an app and the Preview session are Conexus's own, and are not reopened. Basis: Purpose: the three guarantees.

## Criterion

The step 3 study starts from Better Auth's native session at the installed version. The 17 login tests, LT1 to LT17, declared before any login code runs, run against it and decide; they are the acceptance of step 3. Conexus code enters only where a test shows a guarantee missing.

## Result

Local run, 2026-10-14, step 3 study, gate written before it: better-auth 1.7.8
with its Drizzle adapter on PostgreSQL 18, no browser, no Tunnel. Passed natively: the `__Host-` cookie by configuration (LT3, LT7 on the Hub host), a deleted row
refused on the next call (LT14), no stored row opens a session without the secret (LT15), no
undeclared library path (LT17), every sign-up path closed. Missing natively, so Conexus code: a
total deadline, and a sign-out that fails when the row cannot be deleted. Not run: LT16 (see Notes). The other tests belong to steps 4, 8 and 18.

## Notes

LT16, 2026-10-15, through the Tunnel: on v0.3.0 one address got ten 401s, then 429; another got
401. On v0.3.1 the founder read `__Host-conexus_session`: "HttpOnly ✓, SameSite Lax".

Step 14.1, 2026-10-25: no separate Preview session: the Prévia frames the app under its app session ("A1"), entered by `createAppFrameHandoff`.

## Consequences

Code of Conexus's own exists only for a guarantee shown missing. Changing the holder later signs everyone in again once.

## Reopens when

After the step 3 study closes it: a login test fails because of the chosen session.

## State

Reopened, 2026-10-13. Founder: "5 A". Before, brought; founder, 2026-10-12: "3. A".
