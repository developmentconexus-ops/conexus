# 0062. A write declares what only its provider knows

## Context

The Hub's write funnel held three Sankhya facts: the timeout `GTW3503`, the `observacao` field that
carries the mark, and the `codigoPedido` a log prints. `addPedido` also takes `notaModelo`, which
the model must never pick, and no decision said who declares such a field (issue 860). The founder
answered "okay" (24.5 write path study, `D3`) and "2 sim / 3 sim" (kit references study), 2026-11-08. It amends [0056].

## Decision

A connector's write declares three functions of its own:

- `uncertain(native)`: whether the answer leaves the write's end unknown, so the Hub never resends;
- `mark(input, mark)`: the input with the mark where the person finds the write;
- `idOf(value)`: the one value of the answer a log may print.

Any operation may also declare `fixed`: the input fields only whoever configures the tool fills.
They leave the model's schema (`openOf`), and the configured value wins (`{ ...given, ...bound }`).
`defineOperation` refuses a write without the three; the Hub holds no provider's fact.

References (shelf manifest commits): n8n `noDataExpression`, an author's lock against the model
(`2e855356`, `packages/workflow/src/interfaces.ts:2264`); activepieces drops a pinned field from
what the model fills (`f34c43cd`, `packages/server/api/src/app/ee/agent/tools/piece-input-plan.ts:80-87`),
as Windmill does (`5d3f239b`, `backend/windmill-worker/src/ai/utils.rs:65-110`); activepieces tells
"never started" from "may have partially completed" (`packages/server/api/src/app/mcp/tools/flow-run-utils.ts:236-256`).

## Criterion

1. Step 24.5, criterion 32: the Sankhya's write declares the three, and criteria 1, 3 and 4 pass
   with their tests unchanged.
2. Step 24.5, criterion 39: the model's schema has no `notaModelo`, and a version leaving it open or
   unbound is refused with `NOT_FIXED`.
3. No Sankhya literal (`GTW3503`, `observacao`, `codigoPedido`) is left in
   `apps/server/src/hub/connectors/`.

## Result

Not measured yet: unit U4 of step 24.5 builds it.

## Consequences

Each new operation states these facts from its provider's documents and recordings (testing T24).

## Reopens when

A provider's write cannot tell from one answer whether it was taken, has no field for a mark, or
accepts a key against repetition.

## State

Proposed 2026-11-08 with the amendment of the 24.5 card. Amends [0056].
