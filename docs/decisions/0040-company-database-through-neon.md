# 0040. A company's database through Neon's SDK

## Context

Step 7 gives each company a Neon project on first use and removes it with the company.

## Decision

T2A: `@neon/sdk` 7.3.0, exact, imported by one adapter (code C56). T3A: companies live in their own
Neon organization with their own key, so the key the Hub holds for them cannot reach the Hub's
project. T4A: a deleted project is recovered through the SDK, not by the Central. Basis: purpose.

## Criterion

**Question.** Does the SDK serve the card, and does the companies' key stop at its organization?

**Fixed.** `@neon/sdk` 7.3.0, free plan, region `aws-sa-east-1`, PostgreSQL 18, projects named
`cx-prova-<uuid>`.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Create | Project in `aws-sa-east-1` on 18; time measured |
| 2 | Cut reply, then `find` | One exact name |
| 3 | Write a row, delete, `recover` | The row comes back |
| 4 | Delete again | `not_found` |
| 5 | Delete during creation | The SDK repeats a 423 within the deadline |
| 6 | Companies' key reads the Hub's project | Refused |
| 7 | Time of `create` | Gives `NEON_DEADLINE_MS` and the claim |

**Not covered.** Paid plan, load, a hundred projects.

## Result

Run 2026-10-17. 1: 4.6 s, as asked. 2: one project. 3: the row returned. 4: `not_found`. 5 did
not hold: in three runs the delete answered 200 at once, no 423, and the creation then failed
`not_found`. 6: `not_found`, refused. 7: `NEON_DEADLINE_MS` is 60 000: a request 15 000, the
wait 45 000, thirteen times the one measured create. Created and deleted: `odd-breeze-58556846`,
`fancy-mountain-62206162`, `broad-shadow-99241102`, `dry-recipe-85774664`,
`proud-sea-90646311`. None remains.

## Consequences

A creation cut by a delete returns `not_found`: the adapter reads it as `REFUSED`, and the claim
is released. The deadline rests on one measured create.

## Reopens when

`recover` stops returning the data, or the free plan limits change.

## State

Proposed 2026-10-17. Founder: T2A, T3A, T4A ("3A"). Its find key: 0048.
