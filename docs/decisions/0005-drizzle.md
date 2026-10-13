# 0005. Drizzle owns the schema and the migrations

## Context

The Hub needs a schema owner and a migration history the founder can read.

## Decision

Drizzle owns the Hub's schema and generates its migrations. A query Drizzle cannot express stays in SQL inside Drizzle. The version is fixed, stable line or 1.0, before the first migration. Basis: Decided before, without an explanation; offered again on 2026-10-13 and not asked for. The founder's reason is stated: he reads it.

## Criterion

None written before. Brought from earlier work.

## Result

Not run. Step 2 shows one migration history for two schemas.

## Consequences

Drizzle 1.0 is beta and changes the migration format.

## Reopens when

Drizzle cannot express what the Hub needs without leaving it, in a way that matters.

## State

Brought. Founder, 2026-10-12: "Quero Drizzle e avaliamos quando realmente não é vivavel e podemos utilizar a outra forma".
