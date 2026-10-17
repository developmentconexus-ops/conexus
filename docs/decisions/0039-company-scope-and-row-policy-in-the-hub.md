# 0039. Company scope and row policy in the Hub

## Context

Decision [0012] left the row policy to step 5.

## Decision

Each transaction enters a typed scope (`SET LOCAL ROLE`, `set_config(…, true)`); row policies on the
company tables and `auth.user` bound each role; no `FORCE` (D9). Basis: answers A, B, H.

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

## Result

2026-10-17: local PostgreSQL 18.6, B1–B8 pass; Neon PostgreSQL 18 (patch unread), branch database, direct address, phases 1–2: B1–B5 pass.

## State

Proposed 2026-10-17. Provisional until PR 51: A1, a `SECURITY DEFINER` operator check; A2,
invitations read their company's members.
