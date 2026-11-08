# 0061. A turn carries its version and activation as a Mastra agent scope

## Context

A turn that stopped on a write's card used to go on, after the Aprovar, with whatever version was
registered by then: a version published in the meantime changed the instructions, the tools and who
answers for the write. The founder's answer of 2026-11-08 to the study of the cause: "1sim 2sim 3
nao" (the architecture of option 3.1, the one rule for conversations and workflows, and no issue to
Mastra).

## Decision

A published turn carries its version and its activation, `{ number, answeredBy }`, as an agent scope
of the run, `conexus-activation:<number>/<person>`. It is written once, at the start of a new turn,
by the `scopes` option of the controller's delegating agent (`agents/resolver.ts`, `scopesOf`), and
read until the end: Mastra keeps the scopes with a run parked on a card and gives them back, unchanged,
to the run that resumes, before it resolves the model, the instructions and the tools. The registry
makes the version again from its row when it is no longer the registered one (`Registry.resolve(run,
pinned)`). The next turn takes the registered version. The role of who answers is still read at each
call (decision of step 24.5, D2-a). The draft has no activation.

The one rule for conversations and workflows: **an execution writes its identity (its version and who
activated it) once, at its start, in the state that Mastra keeps with it, and reads it from there to
its end; nothing in the middle reads the "active" pointer again.** In a conversation that state is the
scope of the turn; in a workflow (step 24.6) it is the execution's `requestContext` and the version's
own Mastra id.

## Criterion

**Fixed.** `@mastra/core` 1.82.0. The option is native: a documented `Agent` option, not a piece of
ours over the library. It is marked `@experimental` (`dist/agent/scopes.d.ts:14`).

1. The test "um cartão aberto fixa o turno na versão em que começou…" (`answer.test.ts`): a version
   published while the card waits does not reach the resumed turn, and the next turn takes it.
2. "a pessoa da ativação fixada responde depois do Aprovar…": the person of the pinned activation
   answers after the Aprovar.

If Mastra changes how scopes are kept or given back on a resume, test 1 fails in CI.

## Result

2026-11-08, on the branch of the pull request
https://github.com/developmentconexus-ops/conexus/pull/852: both tests pass, and fail without the
activation in the scopes.

## Consequences

The decision depends on an option marked experimental; the test of the resumed card is what notices a change. No
table, column or reading of Mastra's stored runs is added. The adjustment of the 24.6 card's U3 (the
agent balloon reads the activation from the same place, `activationIn`) goes to that step's builders.

## Reopens when

Mastra removes or changes the `scopes` option, or the test of the resumed card fails after a Mastra bump.

## State

Accepted 2026-11-08, at the founder's answer "1sim 2sim 3 nao".
