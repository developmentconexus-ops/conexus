# 0061. A turn carries its activation as a Mastra agent scope

## Context

A turn parked on a write's card went on, after the Aprovar, with the version registered by then: a
version published meanwhile changed the instructions, the tools and who answers for the write. The
founder answered on 2026-11-08: "1sim 2sim 3 nao".

## Decision

A published turn carries its version and activation, `{ number, answeredBy }`, as an agent scope,
`conexus-activation:<number>/<person>`. `scopesOf` (`agents/resolver.ts`) writes it once, at the
start of a new turn; Mastra gives it back unchanged to the run that resumes. The registry makes the
version again from its row (`Registry.resolve(run, pinned)`). The next turn takes the registered
version. Who answers is still read at each call. The draft has no activation.

The one rule for conversations and workflows: **an execution writes its identity (version and
activation) once, at its start, in the state Mastra keeps with it, and reads it from there to its
end; nothing in the middle reads the "active" pointer again.** In a workflow (step 24.6) that state
is the execution's `requestContext`.

## Criterion

**Fixed.** `@mastra/core` 1.82.0. The option is native, and marked `@experimental`
(`dist/agent/scopes.d.ts:14`). The tests in `answer.test.ts` catch a change: a version published
while the card waits does not reach the resumed turn, and the pinned person answers after the
Aprovar. If Mastra changes how scopes come back on a resume, they fail in CI.

## Result

2026-11-08, pull request 852: both tests pass, and fail without the activation in the scopes.

## Consequences

No table, column or reading of Mastra's stored runs is added. The 24.6 card's U3 reads the
activation from the same place (`activationIn`); its builders adjust it.

## Reopens when

Mastra removes or changes `scopes`, or those tests fail after a Mastra bump.

## State

Accepted 2026-11-08, at the founder's answer "1sim 2sim 3 nao".
