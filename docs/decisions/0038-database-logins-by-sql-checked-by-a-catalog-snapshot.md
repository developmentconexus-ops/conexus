# 0038. Database logins by SQL, checked by a catalog snapshot

## Context

Data D10 and D11 came from the old repository without a record. Step 2 created the Hub's login,
`hub_runtime`, and first checked the catalog with queries written by hand, which missed the owners
and default privileges that the old repository's check saw.

## Decision

Every login and grant is created by SQL in a migration, never by Neon's console or API (D10). After
migration, a `pg_dump --create --schema-only` and `pg_dumpall --roles-only --no-role-passwords`
snapshot, kept to owners, grants, default privileges and roles, must equal the approved file
`apps/server/database-grants.sql` (D11). Basis: purpose, with the evidence below. Neon's
database-access page, read 2026-10-14, also advises a role per application, created by SQL with only
the privileges it needs.

## Criterion

None written before. Proved during step 2, by the audit of the hand-made parts and by the proofs.

## Result

Run 2026-10-14. On PostgreSQL 18.6, with `neon_superuser` imitated as Neon documents it, a member
login deleted the migration ledger through `pg_write_all_data`, and after one `SET ROLE
neon_superuser` read every row past a row policy; `hub_runtime` was refused all three. A schema owned
by `hub_runtime` and a default `DELETE` privilege, planted, showed in the snapshot without a query of
ours. On the Hub's Neon project the owner login and `neon_service` are members of `neon_superuser`,
and `hub_runtime` is not. The snapshot there holds every approved line unchanged, plus Neon's own
roles and grants, so the equality is checked on the CI cluster only.

## Consequences

The test cluster must be disposable: another role on it fails the equality. On Neon the owner login
holds `neon_superuser`, so its key stays with the `migrate` service alone. The company projects'
logins of step 7 follow the same rule (architecture section 5; decision [0021]).

## Reopens when

Neon's API creates a login outside `neon_superuser`, or the snapshot stops seeing a kind of grant.

## State

Accepted. Founder, 2026-10-14: "Aprovo A" (the snapshot) and "Aprovo sua recomendação" (this record).
