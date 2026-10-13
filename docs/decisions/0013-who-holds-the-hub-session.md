# 0013. Who holds the Hub's session

## Context

The founder requires three guarantees of the Hub's session: no stored row works alone to sign in; the cookie is valid for one exact host; there is an idle and a total deadline. On 2026-10-13 he asked why Conexus should keep a session of its own when Better Auth already manages one, and the decision was reopened.

## Decision

Open. The three guarantees are requirements, whatever holds the session. App sessions, the handoff to an app and the Preview session are Conexus's own, and are not reopened. Basis: Purpose: the three guarantees.

## Criterion

The step 3 study starts from Better Auth's native session at the installed version. The 17 login tests, LT1 to LT17, declared before any login code runs, run against it and decide; they are the acceptance of step 3. Conexus code enters only where a test shows a guarantee missing.

## Result

Not run.

## Consequences

Code of Conexus's own exists only for a guarantee shown missing. Changing the holder later signs everyone in again once.

## Reopens when

After the step 3 study closes it: a login test fails because of the chosen session.

## State

Reopened, 2026-10-13. Founder: "5 A". Before, brought; founder, 2026-10-12: "3. A".
