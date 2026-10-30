# 0058. Provider limits: the 429 wait now, one call per connection in step 20, a Postgres queue with the webhooks

## Context

A provider's 429 showed "não consegui ler" in Testar, and the kit never saw the response
headers, so `Retry-After` was lost. No reference throttles against a provider's quota, and
Conexus has one Mercado Livre app, so every company shares it. Basis: the founder approved the study's path on 2026-10-30.

## Decision

- **Now:** a 429 on a data read is its own outcome, `BUSY`, with the wait the provider asked for.
  The executor waits that time once, when it fits the call's deadline, and repeats an idempotent
  read once; otherwise it answers `BUSY`. The person reads "O fornecedor pediu para esperar".
- **Step 20:** one call at a time per connection, in process; a waiter past its deadline gets DEADLINE.
- **With the webhooks step:** a Postgres queue (pg-boss).
- **Not now:** a large workflow engine, Redis, or a limiter shared across Hub copies.
- The in-process limiter holds only while one Hub process runs. It moves to the database before a
  second Hub process starts.

## Criterion

| # | Check | Passes when |
| --- | --- | --- |
| 1 | `connections-busy.test.ts` | A 429 within the deadline waits and reads; a longer wait, a second 429 or none named is `BUSY` |
| 2 | `kernel.test.ts` | A 429 is `BUSY` with the wait; other statuses keep their outcome |
| 3 | `text.test.tsx` | The wait reads in seconds or minutes |

## Result

Rows 1 to 3 met. **Not proved.** No real provider is called (S40); the wait a real Mercado Livre
asks for is unmeasured.

## Consequences

Token calls keep mapping 429 as UNREACHABLE. A write that gets a 429 is not repeated.

## Reopens when

A second Hub process is planned, or the measured use of a provider's quota says reads should be
synced into the company's database.

## State

Approved by the founder on 2026-10-30 (the study's path); this record is proposed with the fix.
