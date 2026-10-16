# 0037. PostgreSQL 18 and Drizzle 1.0 for the Hub's database

## Context

Step 2 writes the Hub's first migration, which fixes the Drizzle version [0005], on a Neon
project whose PostgreSQL major version only a copy can change. Steps 7 to 10 rest on Neon's HTTP
driver [0020].

## Decision

The Hub's Neon project runs PostgreSQL 18, Neon's default for new projects. Drizzle is pinned at
`1.0.0-rc.4`: its migrator applies by name, and it ships row schemas for Zod (code C27). Basis:
purpose. The earlier proofs ran on 18, and 17 answered the same.

## Criterion

**Question.** Do PostgreSQL 18 and Drizzle `1.0.0-rc.4` hold the Hub's database on Neon's free plan,
and does the HTTP path work on that version?

**Fixed.** Neon free plan, AWS São Paulo, PostgreSQL 18. `drizzle-orm` and `drizzle-kit`
`1.0.0-rc.4`, `pg` 8.23.1, `@neondatabase/serverless` 1.1.0. Cloudflare Workers free plan. A
throwaway project for checks 3 to 5, deleted after.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Migrate the Hub's database twice, as the owner, on the direct address | First run applies every migration; second applies none |
| 2 | Connect as the runtime login | Its file's password works; `DELETE` and DDL refused, SQLSTATE 42501 |
| 3 | A Worker reads a row with `neon()` | The row comes back |
| 4 | Three separate writes, then a failing one | Three rows stay |
| 5 | One `transaction()` whose last statement fails | No row stays |
| 6 | Restore before the migration, then migrate | The same ledger and grants as check 1 |

**Not covered.** Load, a paid plan, a company's project shape, Drizzle stable.

## Result

Run 2026-10-14 on the live Hub: all six checks passed. On Neon, `neon_superuser` holds the owner login, not `hub_runtime`.

## Consequences

A Drizzle release candidate holds the migration ledger until 1.0 is stable.

## Reopens when

A check fails, or Drizzle's stable 1.0 changes the ledger or the folder format.

## State

Proposed 2026-10-14. Accepted in use: "Deu certo".
