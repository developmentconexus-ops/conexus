# 0012. The company column on every company table; the row policy later

## Context

The founder asked for a working product first, then defence in depth.

## Decision

Every Hub table that holds a company's data has the company column, and every transaction on it carries the company, from the first such table. An installation table, such as the Hub's starts, has none. Whether PostgreSQL row policies form a second wall is decided in step 5, by a nine-item list run with two companies, before the first outside company. Basis: The founder's answer, after explanation. The references read either start with the policy or never use it.

## Criterion

None written before. Brought from earlier work.

## Result

Admission alone refused cross-company reads in the Builder trial. Step 5 proved the policy with two companies, live since v0.5.0 [0039].

## Consequences

Since step 5, row policies hold a Hub mistake in the database [0039].

## Reopens when

Step 5's list fails, or a route that forgot admission is found.

## State

Brought. Founder, 2026-10-11: "primeiro deixar o app funcional, corretamente e depois fazemo defense in depth". Amended 2026-10-14 for installation tables, founder: "1. A". Step 5 decided the policy: [0039], accepted in use 2026-10-17.
