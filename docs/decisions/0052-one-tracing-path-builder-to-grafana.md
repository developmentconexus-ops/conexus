# 0052. One tracing path: Hub and Builder spans to Grafana, in step 21.1

## Context

Step 12 turns Mastra's tracing off (S42). The observability study (2026-10-19) proposed the
Builder's native spans in Mastra's database from step 13 and OpenTelemetry on the Hub later.

## Decision

One path. Step 13 sends no Builder span to a database: each turn writes one log line (duration,
steps, tokens, end reason, failing tool and error code) and carries the Hub request id in
`tracingOptions`, with `loggerOptions.export` false. Step 21.1 "Ver o que acontece" adds
OpenTelemetry on the Hub (Fastify, `pg`) and `@mastra/otel-exporter` for the Builder, with the Hub
span as parent, to Grafana Cloud's free tier in a Brazil region: one allowlist (S42), logs off.
The audit trail is the Hub's own append-only table, shown as "Atividade". Published apps keep only
Cloudflare's invocation logs. This reverses that proposal.

## Criterion

**Question.** Does the free tier in a Brazil region take the Hub and Builder spans under one
trace, with nothing outside the allowlist?

**Fixed.** The versions step 21.1 installs; a Brazil region.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | One Builder turn through the Hub | One trace, the Hub span as parent |
| 2 | A planted conversation text and CPF | Absent from every exported span |

If 1 fails, the fallback is Jaeger on the server (founder's second choice).

## State

Proposed 2026-10-19. Founder: A on all four calls of the study; then (2026-10-19): "Okay di grafana e um
so da telemtria do builder pro hub(B)".
