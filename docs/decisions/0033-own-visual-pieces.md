# 0033. Conexus's own visual pieces on every administration screen

## Context

The old screens used Mastra's component library everywhere, on the only basis of an older decision, and it changed seven major versions since.

## Decision

Administration screens use Conexus's own pieces, copied from shadcn into `ui/` on Base UI and painted with the brand. `@mastra/*` is imported only inside `builder/`. Whether the Builder conversation uses Mastra's pieces or ours is chosen at step 12 with a prototype. Basis: Purpose: the pieces' code lives where the founder and agents read it, without the library's version stream. Base UI rather than Radix: decided before (the generated apps use it), accepted because one set of pieces then serves the Hub and the apps.

## Criterion

None written before. Brought from earlier work.

## Result

Run at step 12.1: the Builder conversation uses the shadcn chat pieces (AI Elements) on Base UI,
copied into `ui/` and painted with the brand; Mastra's own pieces stay out. They run under the
Hub's policy with no console error, at 390 px and 200% zoom in both themes, and the founder's use
script runs on them in a real browser (`tests/e2e/conversation.test.ts`).

Founder's calls at 12.1, 2026-10-20: a model's name comes from its id by one rule, falling back to
the id ("1 C"); the trigger names the model and its level ("2 A"); the Projeto's name heads its
area ("3 A"); reasoning is a draggable slider ("4") over the levels Mastra lists for the model,
"Desligado" only where the model can stop, with no "Mínimo"; models keep Mastra's order. On the
redrawn screen: "2. Okay", "5. Okay".

## Consequences

Most administration screens are written new.

## Reopens when

The prototype of step 12.

## State

Brought. Founder, 2026-10-13: "1. A".
