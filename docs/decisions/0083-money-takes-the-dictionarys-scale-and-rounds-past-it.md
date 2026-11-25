# 0083. Money takes the dictionary's scale, and rounds at the ninth place without one

## Context

[0071] said "a value that does not fit fails the run" and left "a real Sankhya copied into the
lake" to return to the founder if it failed. It failed (issue 1380): the first real copy ended in
`COPY_LAKE_WRITE_FAILED` on `TGFCAB`. A value with more
than 9 decimal places did not fit the fixed `decimal(38,9)` of every numeric column. Of the table's
129 numeric columns one declares a scale in the real Oracle (`VLRDESCPARCERIA`, `NUMBER(18,4)`); the
rest are `FLOAT`, `NUMBER` or `NUMBER(p,0)`, and a calculated one carries ten places or more.
No reference fails the load: dlt copies the column's own precision and scale
(`schema_types.py:158-164`), Fivetran keeps the declared ones, and Airbyte on Snowflake rounds a
`NUMBER(38,9)` cell half up at the ninth place and flags it (`SnowflakeValueCoercer.kt:160-181`).

## Decision

- A numeric column takes the precision and scale its source's dictionary declares: `decimal(p,s)`.
  The Sankhya dictionary reads `DATA_PRECISION` and `DATA_SCALE`.
- A column with no declared scale stays `decimal(38,9)`; the writer rounds its values half up at
  the ninth place and counts the rounded cells per table in the round's result.
- An integer part past the column's digits (29 in `decimal(38,9)`) still fails the run with
  `COPY_LAKE_WRITE_FAILED`, the batch unwritten.
- Money stays a decimal read from the source's own text, never a `double` [0071].

## Criterion

Card criterion 22: ten places or more in a column without scale are rounded and counted, and the
batch lands; a declared scale is kept; a 30-digit integer part fails.

## Result

None yet.

**Not proved.** A real Sankhya copied into the lake with this writer.

## Consequences

Amends [0071]. Iceberg does not change a column's scale, so a column whose type changes, such as
`VLRDESCPARCERIA`, needs the lake's two empty tables `raw.sankhya_notas` and `current.sankhya_notas`
dropped before the next real run: the founder's word.

## Reopens when

A rounded ninth place matters, or a connector declares a scale above 9.

## State

Accepted 2026-11-25. Founder: "1. A2".

[0071]: 0071-connectors-kit-live-copies-singer.md
