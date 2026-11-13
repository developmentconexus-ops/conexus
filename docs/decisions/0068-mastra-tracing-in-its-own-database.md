# 0068. Mastra's native tracing, kept in Mastra's database

## Context

[0052] kept one tracing path, OpenTelemetry to Grafana at 21.1, and no Builder span in a database.
On 2026-11-13 an Assistant turn failed with a 400 and the Hub kept only the status. The founder:
"vamos habilitar o Master Traces"; then "a gente não vai utilizar a plataforma do master, a gente
vai guardar no nosso banco." The card is `docs/steps/pattern-o-rastreio-do-mastra.md`.

## Decision

- One `Observability` (`@mastra/observability` 1.23.1, released with `@mastra/core` 1.82.0) on the
  Hub's one `Mastra`: every controller and workflow is traced by that registration, with no code per
  agent.
- One exporter, `MastraStorageExporter`, into Mastra's database [0010]. No platform exporter, no
  token: nothing leaves Brazil, and [0032] gains no line.
- Spans keep input, output and error, the provider's answer body included. This is the one exception to
  security S41; the guide takes the sentence at the card's closing (L20).
- Mastra's defaults: sampling `always`, `SensitiveDataFilter`, serialization limits.
- Spans expire by age through Mastra's `retention` and `prune()`; the card names the store and the
  age, each with the founder's word.
- OpenTelemetry stays open for 21.1 as one more exporter; S42 governs what leaves.

## Criterion

The card's criteria. Stop rule: a recorded Builder turn whose spans, projected to today's turns per
day and the chosen age, pass the card's storage bound returns to the founder before the merge.

## Result

Not run.

## Consequences

Mastra's database holds person-written text and connector rows as the model saw them, after
`readThrough`, for the chosen age. Deleting a company leaves its spans until they age out. Each turn
adds writes while it runs.

## Reopens when

The volume outgrows Postgres (ClickHouse is the card's next store), a company refuses content in
traces, or 21.1 sends spans out.

## State

Proposed 2026-11-13. Supersedes [0052].

[0010]: 0010-mastra-tables-own-database.md
[0032]: 0032-data-leaving-brazil-told.md
[0052]: 0052-one-tracing-path-builder-to-grafana.md
