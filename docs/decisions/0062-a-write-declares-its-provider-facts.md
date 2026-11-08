# 0062. A write declares what only its provider knows

## Context

The Hub's write funnel held three facts of the Sankhya: the gateway's timeout `GTW3503`, the
`observacao` field that carries the mark, and the `codigoPedido` a log prints. A second connector's
write would have none of them. The founder answered the 24.5 write path study's `D3` on
2026-11-08: "okay". It amends [0056].

## Decision

A connector's write declares, beside its class, three functions of its own:

- `uncertain(native)`: whether the provider's answer leaves the write's end unknown, so the Hub
  never sends it again;
- `mark(input, mark)`: the input with the mark where the person finds the write;
- `idOf(value)`: the one value of the answer a log may print.

`defineOperation` refuses a write without them. The Hub asks the operation and holds no provider's
fact.

## Criterion

1. Step 24.5, criterion 32: the Sankhya's write declares the three, and criteria 1, 3 and 4 pass
   with their tests unchanged.
2. No Sankhya literal (`GTW3503`, `observacao`, `codigoPedido`) is left in
   `apps/server/src/hub/connectors/`.

## Result

Not measured yet: unit U4 of step 24.5 builds it.

## Consequences

Each new write states its uncertain answers, its mark and its id from its own provider's documents
and recordings (testing T24 for models; the connector rule proposed beside it).

## Reopens when

A provider's write cannot tell from one answer whether it was taken, or has no field for a mark.

## State

Proposed 2026-11-08 with the amendment of the 24.5 card. Amends [0056].
