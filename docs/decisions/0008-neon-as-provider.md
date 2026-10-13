# 0008. Neon holds every database

## Context

Conexus needs PostgreSQL with point-in-time restore and one project per company.

## Decision

Neon holds the Hub's databases and every company's project. Basis: Purpose by reading: six providers compared. Only tested so; accepted because leaving by `pg_dump` worked.

## Criterion

None written before. Brought from earlier work.

## Result

The old Hub ran on Neon unchanged; a company left and re-entered Neon with the same rows; restoring one company did not touch another.

## Consequences

One vendor for all data.

## Reopens when

Restore or isolation fails on Neon, or the price changes beyond the plan.

## State

Brought. From the cloud study of 2026-10-09.
