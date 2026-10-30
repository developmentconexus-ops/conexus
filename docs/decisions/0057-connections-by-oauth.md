# 0057. Connections by OAuth: one authorization row, a leased refresh, the app in one place

## Context

Step 19.1 links a company to a provider the person authorizes, the Mercado Livre first; its refresh
token is single use. Basis: the step
19.1 card, approved by the founder on 2026-10-29 (`W1`, `V2`, `U1`, `Y1`).

## Decision

- An authorization in progress is a row of `connectors.connection_sign_in`: the PKCE verifier,
  sealed, for one person, ten minutes, taken once by `DELETE … RETURNING` before
  the provider is called (the shape of [0049]).
- The return page has no effect; it calls a `session` route with the code. The `state` carries
  only the company and the row.
- The tokens live sealed in the connection. A refresh is leased in the database (30 s): one caller
  refreshes with its own 10 s deadline and stores on the `revision` it read; the others reread
  until the revision changes, the lease drops or their deadline ends.
- The grant refused sets `NEEDS_REAUTH`; the app refused changes nothing and logs an error.
- The app keys come from one file (`HUB_CONNECTOR_APPS_FILE`), read only by `appKeysOf`.
- Remendo: each Mercado Livre route is checked against the page it cites.

## Criterion

| # | Check | Passes when |
| --- | --- | --- |
| 1 | `sign-ins.test.ts` | Criteria 6, 7, 8, 16, 18 |
| 2 | `connections-refresh.test.ts`, `connections-copies.test.ts` | One refresh across two Hubs (11 to 15, 19) |
| 3 | `connections-oauth-logs.test.ts` | No token, code or secret leaves (9) |
| 4 | `mercado-livre/docs.test.ts` online | Each route is on its page (21) |

## Result

Rows 1 to 3 met in U2's tests. **Not proved.** Row 4 runs in U0's job; no real Mercado Livre is
called (S40).

## Consequences

A connection unused for six months, or a refresh answer lost, asks Conectar de novo.

## Reopens when

A provider's refresh needs idempotency, or a company brings its own app.

## State

Proposed 2026-10-30 with step 19.1's U2; awaits the founder's approval.

[0049]: 0049-model-accounts-keys-sign-ins-queues.md
