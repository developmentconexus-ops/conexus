# 0046. A version's Worker before its migrations, all in one transaction

## Context

The step 9 card sends a version by migrating the company's database first and uploading the Worker
after, one transaction per migration. A version whose code does not start would then leave its
migrations applied, and a failing second migration would leave the first.

## Decision

P4 A: the send uploads the version's Worker `v-<id>` first; Cloudflare refuses code that does not
start (10021) before the company's database is touched, and the version fails as "O app não
inicia" (`APP_VERSION_NOT_STARTING`). P6 A: then every pending migration of the version runs in one transaction with its rows in
the app's ledger, each with the SHA-256 of its statements; an applied migration whose text changed
is refused with `APP_MIGRATION_CHANGED`. Basis: founder's answers P4 A and P6 A, 2026-10-18; the old
Conexus and Drizzle apply all pending migrations in one transaction.

## Criterion

**Question.** Does one transaction leave nothing of a version whose second migration fails?

**Fixed.** PostgreSQL 18.6, the app's migrate login owning its schema.

1. Two migrations, the second broken, in one transaction: 42601, neither applied, no ledger row.

**Not covered.** Error 10021 through the namespace API, Neon's proxy.

## Result

Run 2026-10-18, outside the repository. 1: 42601; only the empty ledger stayed.

## Consequences

The Worker of a version that fails at its migrations is uploaded and never on the air; it leaves with
the prune. A Worker that does not start fails the send before any migration.

## Reopens when

Cloudflare accepts a Worker that cannot start, or a version needs one migration applied without the
next.

## State

Accepted 2026-10-18. Founder: P4 A, P6 A.
