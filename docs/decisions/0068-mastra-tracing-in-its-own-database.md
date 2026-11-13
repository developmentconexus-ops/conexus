# 0068. Mastra's native tracing, kept in Mastra's database

## Context

[0052] kept one tracing path, OpenTelemetry to Grafana at 21.1. An Assistant turn failed with a 400
on 2026-11-13 and the Hub kept only the status. The founder: "a gente não vai utilizar a
plataforma do master, a gente vai guardar no nosso banco." Card: `docs/steps/pattern-o-rastreio-do-mastra.md`.

## Decision

- One `Observability` (`@mastra/observability` 1.23.1) on the Hub's `Mastra` traces every
  controller and workflow, with no code per agent.
- One exporter, `MastraStorageExporter`, into Mastra's database [0010]: no platform exporter, so
  nothing leaves Brazil and [0032] gains no line.
- Spans keep input, output and error, the provider's body included: the one exception to
  security S41, written into the guide at the card's closing (L20).
- Sampling `always`, `SensitiveDataFilter`; no chunk spans; a step keeps 500 messages.
- The store is Mastra's v-next Postgres domain (A2) on the Hub's Neon, on the paid Launch plan
  since 2026-11-12, though a turn exceeds the card's 600 KB bound (below). Spans expire after
  14 days (B1) by `retention` and a daily `prune()`. Neon's SQL Editor reads a trace (E1).
- OpenTelemetry stays open for 21.1 as one more exporter (S42).

## Result

An Assistant turn with a read wrote about 1.5 MB, a Builder turn with one tool about 430 KB: at
58 turns a day for 14 days, about 1.2 GB, about US$ 0.42 a month at US$ 0.35 per GB. Over the
bound, the founder answered "1. Sim": A2 on paid Neon, whole trace, no `spanFilter`.

## Consequences

Mastra's database holds person-written text and connector rows as the model saw them, after
`readThrough`, for 14 days, open only to us.

## Reopens when

The volume outgrows Postgres (the card's next store is ClickHouse), a company refuses content in
traces, or 21.1 sends spans out.

## State

Accepted 2026-11-13: "A A2 B B1 E E1"; "1. Aprovo 2. Aprovo" (the page; the S41 exception).
Amended 2026-11-13: "1. Sim" (A2, over the bound) and "2. SIm" (500 messages a step; no chunk spans).
Supersedes [0052].

[0010]: 0010-mastra-tables-own-database.md
[0032]: 0032-data-leaving-brazil-told.md
[0052]: 0052-one-tracing-path-builder-to-grafana.md
