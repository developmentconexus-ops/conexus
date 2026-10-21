# 0053. The Builder's allowed tools run without asking, and `yolo` stays off

## Context

With `yolo` off, Mastra's agent controller sets `requireToolApproval: true` on every run
(`agent-controller-DRiP9C5v.js:8216`). Each tool call then suspends the run, saves its snapshot, and
the controller answers the rules (0050) by resuming it. That saved a suspended snapshot several
times for two tools, and under load the resume can find the snapshot deleted
(`AGENT_RESUME_ALREADY_CLAIMED`) and end the turn in error (`@mastra/core` 1.78.0).

## Decision

`yolo` stays off (card U6, "nunca yolo"), and the rules allow `read`, `edit` and `execute` and deny
the rest. A tool that answers for itself whether it needs approval is not suspended: the verdict of
a per-tool `requireApproval` function replaces the run's (`agent-Blan8B5o.js:30144-30162`). So the
workspace's tools take `requireApproval: () => false` in their `tools` config, and `web_fetch` is
Mastra's tool rebuilt with the same answer. `recall` is Memory's and has none: the rule of its
category allows it and the controller approves it at once, one suspend and resume. The mode's
`availableTools` closes the set the model is offered.

## Criterion

**Question.** Does a turn that reads, writes and runs end complete with no run saved waiting?

**Fixed.** `@mastra/core` 1.78.0.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | A turn calling `web_fetch`; a turn writing and running | No run saved suspended |
| 2 | A turn calling `recall` | The tool runs and the turn ends complete |

## State

Accepted 2026-10-20. Founder: "Pode deixar como liberar tudo, no futuro pensamos, vamos
simplificar pelo menos por agora", then "B Eu autorizo". 2026-10-21: the mechanism changed from
`yolo` to the tools' own answers, since the approved card says never `yolo`; what the founder
decided, that the allowed tools run without asking, is the same.
