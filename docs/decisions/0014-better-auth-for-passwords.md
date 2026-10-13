# 0014. Better Auth for password, reset and attempt limit

## Context

Password handling is solved code. Who holds the session is open [0013].

## Decision

Better Auth handles password, password reset and the sign-in attempt limit. Basis: The founder's answer, after explanation.

## Criterion

None written before. Brought from earlier work.

## Result

Not run.

## Consequences

If the session stays apart from Better Auth's [0013], library routes that expect its own session need a path around it.

## Reopens when

One of the 17 login tests fails because of the library.

## State

Brought. Founder, 2026-10-13: "4. A".
