# 0010. Mastra's tables in a database and login of their own

## Context

Mastra creates its own tables for threads, memory and traces.

## Decision

A second database in the Hub's Neon project holds only Mastra's tables, under a login that cannot enter the Hub's database. Mastra creates its tables at start. Basis: Purpose: PostgreSQL does not query across databases, so a grant given by mistake cannot open the wall, as it could with a schema. It keeps an earlier decision of the cloud study.

## Criterion

None written before. Brought from earlier work.

## Result

Not run. Step 12 tests that Mastra's login is refused by the Hub's database.

## Consequences

Deleting a company passes through two databases; Mastra deletes one thread at a time.

## Reopens when

Mastra needs to join a Hub table, or the second database keeps the project awake.

## State

Brought. Founder, 2026-10-12: "2 sim".
