# 0053. The Builder's tools run without asking: the controller's `yolo`

## Context

Mastra's agent controller makes every tool call of a run wait for approval unless the session's
state holds `yolo` (`requireToolApproval: !isYolo`), and gives the answer of its rules (0050) by
resuming the run. Under load, that resume can find the run's saved snapshot deleted, throw
`AGENT_RESUME_ALREADY_CLAIMED` and end the turn in error, the pages still "Lendo" (`@mastra/core`
1.78.0, still in 1.79.0-alpha.8).

## Decision

The Builder's controller starts every session with `yolo: true`, as Mastra Code's SDK does
(`mastracode/sdk/src/index.ts:1331`, and `requireToolApproval: yolo !== true` at `:858`) and Mastra
Factory keeps; Conexus OS set it on each turn (`apps/hub/src/builder/run/turn.ts:52-53`). No
approval, no resume: `web_fetch`,
`web_search` and `recall` run at once. The permission rules and the category resolver of 0050
leave, since only the approval path read them. The Builder has no tool that writes or runs, and
the controller's own such tools stay disabled.

## Criterion

**Question.** Does a turn that reads several pages at once end complete under load, with no run
waiting for an approval?

**Fixed.** `@mastra/core` 1.78.0.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | The three research tests, seven copies at once, 56 runs | Every run passes |
| 2 | A turn calling `web_fetch` and `recall` | No run saved suspended |

## State

Accepted 2026-10-20. Founder: "Pode deixar como liberar tudo, no futuro pensamos, vamos
simplificar pelo menos por agora", then "B Eu autorizo". Fixed allow and deny rules return to the
founder when tools that write or run arrive (step 13).
2026-10-21, step 13: the rules did not return to the founder; asked whether to keep "nunca yolo" with
per-tool answers or keep `yolo: true` with the set closed by the mode, he answered "A": `yolo`. The
workspace's write and command tools run too, and the mode's `availableTools` is enforced at the call.
