# 0045. An app's query only reads; its writes go in one batch

## Context

[0020] let `db.query` write and left "no half action" to the Builder's skill and the verifier,
which cannot see writes built at run time. The founder asked for the data path studied again from
zero (2026-10-18).

## Decision

`db.query` runs its statement in a read-only transaction (`transaction([q], { readOnly: true })` of
`@neondatabase/serverless`; the driver sends read-only only for a list), so PostgreSQL refuses any
write with 25006. Every write goes through `db.batch`, one transaction, all or none, at most one per
call, counted by the dispatcher from step 10. Supersedes [0020]. Basis: founder's answer P1 A, 2026-10-18;
PostgREST runs reads the same way.

## Criterion

**Question.** Does a read-only transaction refuse every way to write, and do business patterns fit
one batch?

**Fixed.** PostgreSQL 18.6, a login that is not a superuser, each statement in the extended
protocol, a new connection per call, as Neon's HTTP proxy does.

1. Fourteen ways to write in `db.query`: refused, nothing written.
2. Order and items, stock, last unit, counter, upsert, function, sequence in one batch: written,
   or all undone on a failure.

**Not covered.** Neon's own proxy end to end, the per-call count.

## Result

Run 2026-10-18, outside the repository. 1: 25006, 25001 or 42601 each; no row. 2: each pattern
held; a failing batch left nothing.

## Consequences

A write in `db.query`, `nextval()` or `FOR UPDATE` there fails at the first click; an import goes in
one batch or several calls. Step 9 builds the read-only query; the count of batches per call joins
the count of queries in step 10. The count cannot live in the dispatcher's `Db` entrypoint, which
is built anew for each call to it, so step 10's proof chooses where it lives. Step 10's proof checks
25006 through Neon.

## Reopens when

Neon's proxy runs a read-only batch otherwise, or an app needs two writes in one call.

## State

Accepted 2026-10-18. Founder: P1 A.
