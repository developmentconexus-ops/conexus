# 0020. Every database command of an app is all or nothing by itself

## Context

An app's writes must not leave half an action, and the founder reopened an earlier rule he had accepted without understanding it.

## Decision

`db.query` sends one statement, which Neon runs as one transaction over its HTTP driver. `db.batch` sends several statements as one transaction for writes that must succeed together. The rule against two separate writes lives in the Builder's server skill, and the verifier checks it before Preview. Basis: Purpose, explained to the founder first.

## Criterion

None written before. Brought from earlier work.

## Result

Under this rule the HTTP path passed every line that applies. Three separate writes after a failure keep three rows: that is the agreed behaviour. A batch of five took 97 to 107 ms; a failing batch was not run.

## Consequences

The guarantee depends on the Builder writing right and the verifier catching it.

## Reopens when

An action left half done that the verifier missed.

## State

Brought. Founder, 2026-10-12: "2A". Replaces the rule of 2026-10-09.
