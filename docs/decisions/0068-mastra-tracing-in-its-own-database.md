# 0068. Mastra's native tracing, kept in Mastra's database

## Context

[0052] kept one tracing path, OpenTelemetry to Grafana at 21.1. On 2026-11-13 an Assistant turn
failed with a 400 and the Hub kept only the status. The founder:
"vamos habilitar o Master Traces"; then "a gente não vai utilizar a plataforma do master, a gente
vai guardar no nosso banco." The card is `docs/steps/pattern-o-rastreio-do-mastra.md`.

## Decision

- One `Observability` (`@mastra/observability` 1.23.1, of `@mastra/core` 1.82.0) on the Hub's
  `Mastra` traces every controller and workflow, with no code per agent.
- One exporter, `MastraStorageExporter`, into Mastra's database [0010]. No platform exporter, no
  token: nothing leaves Brazil, and [0032] gains no line.
- Spans keep input, output and error, the provider's answer body included: the one exception to
  security S41, written into the guide at the card's closing (L20).
- Sampling `always` and `SensitiveDataFilter`; no chunk spans; a step keeps 500 messages.
- The store is Mastra's v-next Postgres domain (A2), while a turn stays under about 600 KB at the
  peak of 58 turns a day. Spans expire after 14 days (B1) by `retention` and a daily `prune()`.
  Neon's SQL Editor reads a trace by conversation (E1).
- OpenTelemetry stays open for 21.1 as one more exporter; S42 governs what leaves.

## Criterion

The card's criteria; a turn over the card's storage bound returns to the founder.

## Result

A recorded one-tool turn wrote about 330 KB of spans; 58 turns a day for 14 days project
about 270 MB, under the bound.

## Consequences

Mastra's database holds person-written text and connector rows as the model saw them, after
`readThrough`, for 14 days, open only to us. A deleted company's spans age out; each turn adds
writes.

## Reopens when

The volume outgrows Postgres (ClickHouse is the card's next store), a company refuses content in
traces, or 21.1 sends spans out.

## State

Accepted 2026-11-13: "A A2 B B1 E E1"; "1. Aprovo 2. Aprovo" (the page; the S41 exception).
Supersedes [0052].

[0010]: 0010-mastra-tables-own-database.md
[0032]: 0032-data-leaving-brazil-told.md
[0052]: 0052-one-tracing-path-builder-to-grafana.md
