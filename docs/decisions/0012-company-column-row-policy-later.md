# 0012. The company column on every table; the row policy later

## Context

The founder asked for a working product first, then defence in depth.

## Decision

Every Hub table has the company column and every transaction carries the company from the first table. Whether PostgreSQL row policies form a second wall is decided in step 5, by a nine-item list run with two companies, before the first outside company. Basis: The founder's answer, after explanation. The references read either start with the policy or never use it.

## Criterion

None written before. Brought from earlier work.

## Result

Admission alone refused cross-company reads in the Builder trial. No policy proof yet.

## Consequences

Until a policy exists, the database does not hold a Hub mistake.

## Reopens when

Step 5's list fails, or a route that forgot admission is found.

## State

Brought. Founder, 2026-10-11: "primeiro deixar o app funcional, corretamente e depois fazemo defense in depth".
