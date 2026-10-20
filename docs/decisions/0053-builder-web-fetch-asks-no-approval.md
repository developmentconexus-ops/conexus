# 0053. The Builder's `web_fetch` runs without the controller's approval

## Context

Mastra's agent controller makes every tool call of a run wait for approval (`requireToolApproval`
unless `yolo`), and gives the answer of its rules (0050) by resuming the run. Under load, that
resume can find the run's saved snapshot deleted, throw `AGENT_RESUME_ALREADY_CLAIMED` and end the
turn in error, the pages still "Lendo" (`@mastra/core` 1.78.0, still in 1.79.0-alpha.8).

## Decision

The Builder gives its agent Mastra's own `web_fetch` whole, with its `requireApproval` answering
no; Mastra ranks a tool's own answer above the controller's (`resolveToolApprovalVerdict`), so a
call runs at once. `web_search` runs at the provider and never asks. `recall` still asks and is
allowed by its rule: Mastra's memory gives its tool no approval setting, so it keeps the race.
Every other tool still asks, and the rules of 0050 deny it.

## Criterion

**Question.** Does a turn that reads several pages at once end complete under load?

**Fixed.** `@mastra/core` 1.78.0.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | The three research tests, seven copies at once, 56 runs | Every run passes |
| 2 | The Builder's `web_fetch` against Mastra's | Equal but for `requireApproval` |

## State

Accepted 2026-10-20. Founder: "Pode deixar como liberar tudo, no futuro pensamos, vamos
simplificar pelo menos por agora", then "A, Feito". Fixed allow and deny rules return to the
founder with step 13.
