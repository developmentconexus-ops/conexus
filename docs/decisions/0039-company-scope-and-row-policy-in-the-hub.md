# 0039. Company scope and row policy in the Hub

## Context

Decision [0012] left the row policy to step 5.

## Decision

Each transaction opens in a typed scope: `SET LOCAL ROLE` and `set_config(…, true)`. Row policies on
the company tables and `auth.user` limit each role; no `FORCE`, the owner only migrates (D9). Basis:
the founder's answers A, B, H.

A1: policies ask `auth.is_installation_administrator`, a `SECURITY DEFINER` function of a NOLOGIN
role. A2: the invitation scope reads its company's members. Basis: founder's approval, 2026-10-17.

## Criterion

**Question.** Do mandatory scope and row policies hold an unfiltered query or write, keeping 4.1
and 4.2?

**Fixed.** PostgreSQL 18 (patch in the result), Drizzle `1.0.0-rc.4`, pg 8.23.1, Better Auth 1.7.8,
step 4.2's commit. Two synthetic companies; people of A, of B, of both, of none.

| # | Check | Passes when |
| --- | --- | --- |
| B1 | Catalog | RLS on; scope roles cannot log in, own nothing, lack `BYPASSRLS`, reach nothing without context |
| B2 | Positive | Each person reaches their company; one in both, only the scoped one |
| B3 | Forgotten filter | Unfiltered selects, joins and page anchors in A return no row of B |
| B4 | Writes | Insert into B refused (42501); moving a row to B refused; unfiltered update and delete leave B |
| B5 | Recycled connection | A, B, none on one connection, with commit, rollback, savepoint: no context left |
| B6 | Special entries | 4.1 and 4.2 suites pass unchanged; foreign ids widen nothing; the pace stays global |
| B7 | Delete | Only the operator deletes; accounts and B stay |
| B8 | Removal | Removing a policy, the role switch or the scope fails a test |
| B9 | Operation | B1–B5 pass locally and on a Neon branch; v0.5.0 rolls back to v0.4.2; v0.5.1's login reaches no company table; the database sleeps |

**Not covered.** The database owner, a stolen runtime credential, load.

## State

Proposed 2026-10-17.
