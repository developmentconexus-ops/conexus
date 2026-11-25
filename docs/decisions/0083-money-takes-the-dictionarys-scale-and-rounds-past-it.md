# 0083. Money takes the dictionary's scale, and rounds at the ninth place without one

## Context

[0071] said "a value that does not fit fails the run". It failed (issue 1380): the first real copy
ended in `COPY_LAKE_WRITE_FAILED` on `TGFCAB`, because a value with more than 9 places did not fit the
fixed `decimal(38,9)`. One of the table's 129 numeric columns declares a scale (`VLRDESCPARCERIA`, `NUMBER(18,4)`). No
reference fails the load: dlt copies the column's own precision and scale (`schema_types.py:158-164`), Fivetran keeps
the declared ones, and Airbyte on Snowflake rounds a `NUMBER(38,9)` cell half up at the ninth place
(`SnowflakeValueCoercer.kt:160-181`).

## Decision

- A numeric column takes the precision and scale its source's dictionary declares: `decimal(p,s)`.
  The Sankhya dictionary reads `DATA_PRECISION` and `DATA_SCALE`.
- A column with no declared scale stays `decimal(38,9)`; the writer rounds half up at the ninth
  place and counts the rounded cells per table in the round's result and its `COPY_RUN_ENDED` record.
  No cell is marked.
- An integer part past the column's digits (29 in `decimal(38,9)`) still fails the run with
  `COPY_LAKE_WRITE_FAILED`, the batch unwritten.
- Money stays a decimal read from the source's own text, never a `double` [0071].

## Criterion

Card criterion 22: ten places in a column without scale are rounded and counted, and the batch
lands; a declared scale is kept; a 30-digit integer part fails.

## Result

None yet.

**Not proved.** A real Sankhya copied into the lake with this writer.

## Consequences

Amends [0071]. A column whose type changes in an existing table keeps its old type: pyiceberg
0.12.0 accepts the union without changing it (`pyiceberg/schema.py:1700` compares a scale with
itself). So the lab lake's two empty tables `raw.sankhya_notas` and `current.sankhya_notas` were
dropped before the first run with data. In a table with data, a scale change is issue 1387; the count
on the Data page is issue 1388.

## Reopens when

A rounded ninth place matters, or a declared scale differs from the lake's existing column.

## State

Accepted 2026-11-25. Founder: "1. A2"; "1. A / 2. A / 3. A" on the review's decisions.

[0071]: 0071-connectors-kit-live-copies-singer.md
