# 0063. A trace with content stays on the server

## Context

Decision 0052 keeps one tracing path, to Grafana, with no text in any span. Founder, 2026-10-19: `D1`
A, no text. On 2026-11-09 a real use failed, and one log line per turn could not say why. Founder, 2026-11-09: "ser possivel de ver os traces para pelo menos entender
comportamento, melhoria e comparar com plataformas". Measured
on `@mastra/observability` 1.23.1: an 18-step turn weighs 1.78 MB in native spans, 213 KB keeping
only what each step adds. `SensitiveDataFilter` cuts a key by its name and
leaves a CPF in a person's text. Mastra Code warns that its storage exporter fills the main database
(`mastracode/sdk/src/index.ts:787-842`). Codex keeps two targets: a local session
file with content, and telemetry with none (`codex@970111f6`, `otel/src/events/shared.rs:14-64`).

## Decision

Two layers. Structure with no text leaves through step 21.1, as 0052 says. Content stays in one JSONL
file per conversation on a volume of the Hub's server, written by our exporter over Mastra's native
interface. It never leaves the server and never enters Neon. It lives 30 days and goes with its
conversation. Only the Operations Central reads it, and each read leaves a line. This amends 0052
criterion 2, which now holds for what leaves the server, and security S41, which now names this file
as conversation data. Step 21.1's `scrub` moves into its OTel exporter, because `spanOutputProcessors`
run before every exporter (`observability/mastra/src/instances/base.ts:821-828`).

## Criterion

**Question.** Can the Central read a turn's calls, thinking and tools, with no text in a log, a span
that leaves or Mastra's tables?

**Fixed.** The versions step 24.5.2 installs.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | A planted text and CPF in a turn | In the file; absent from logs and `mastra.*` |
| 2 | A planted key | Absent from the file |
| 3 | The company's owner asks for the trace | `NOT_IN_ROLE` |

If 1 fails, the fallback is no content (`H2` B).

## State

Proposed 2026-11-09, step 24.5.2, `H2` and `H3`, waiting for the founder.
