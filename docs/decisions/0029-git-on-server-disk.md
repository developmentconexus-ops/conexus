# 0029. Each app's Git on the server's disk

## Context

Each app's source needs a history that only moves forward.

## Decision

The Git of each app lives on the server's disk, on the Builder's side, with a copy outside at every advance of `main`. Basis: Implemented so and decided before; accepted because the code's home already moved twice in 27 days and a third move gives nothing a person sees.

## Criterion

Step 13: delete a test Project's repository and bring it back from the copy in under 15 minutes.

## Result

Not run.

## Consequences

The server holds state.

## Reopens when

Bringing a repository back takes more than 15 minutes.

## State

Brought. Kept from the old code.
