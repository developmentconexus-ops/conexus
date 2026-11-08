# 0056. Connectors: a kit of definitions and one executor in the Hub

## Context

A company links its own system, the Sankhya first, and reads it without anyone seeing the
credential. It replaces [0031]'s unproved `connectors.fetch`. Basis: the founder's words of
2026-10-28 on step 19's card (`A1`, `I1`, `K1`, `L1`, `M1`, `N`).

## Decision

- The kit `@conexus/connectors` lives in this repository behind a wall: it imports only `zod` and
  Node, and only `apps/server/src/hub/connectors/` imports it (`K1`).
- A connector is a definition: a fixed origin, a declared login, a version, typed operations and a
  read door. Every operation declares `read`, `write` or `destructive`, with no default (`M1`).
- The kit builds each request on the fixed origin, as data; it never sends one.
- A write declares what only its provider knows, which the Hub asks: `uncertain`, `mark`, `idOf`
  (amended 2026-11-08: "okay").
- One executor in the Hub opens the seal, asks the token and sends one call at a time, with a
  deadline, a 2 MiB cap and no redirect (`N`). A connection is the company's, sealed for
  `connection`, and keeps the connector's version (`L1`).
- A local double (`HUB_CONNECTOR_ORIGINS`, loopback only) is the only other origin.
- Testar sends only the connector's `check`.

## Criterion

| # | Check | Passes when |
| --- | --- | --- |
| 1 | `npm run deps` | The wall holds both ways |
| 2 | Conformance against the Sankhya double | Each operation has a class and an answered probe |
| 3 | Testar against the double | Step 19.1's criterion 19 |
| 4 | Testar with the founder's read-only user | `WORKING` (criterion 21) |

## Result

Step 19 U3: rows 1 to 3 met.

**Not proved.** Row 4: tests call no real Sankhya (S40).

## Consequences

A connector is code reviewed here. No token is kept between calls until step 20.

## Reopens when

A provider needs a call the kit cannot declare as data, or a Worker cannot reach the executor.

## State

Proposed 2026-10-29; awaits the founder's approval.
