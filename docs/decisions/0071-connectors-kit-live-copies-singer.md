# 0071. Connectors: the kit serves live calls, copies run as Singer taps

## Context

[0069] kept the kit as the one source, with copies in our own engine. The founder
chose Singer as the copy contract, run by Meltano, and asked that no piece take one system's shape.

## Decision

- The kit stays each system's one definition: live reads, writes, sign-in and renewal [0057].
- A copy is a Singer tap under Meltano, in the copy task [0076]. The target is ours: the ready ones
  stored money as `double`.
- One adapter makes the tap from the kit for every API system. It reads only the copy declaration
  [0080], imports only the kit's index and names no connector; its tests run for every connector
  declaring a table. Machine rules, from the first copy stage.
- Money stays an exact decimal; a value that does not fit fails the run.
- Meltano's ready taps stay out until a system asks; they are references.

## Criterion

Written after the proofs, 2026-11-21: one adapter copies two connector classes naming neither, and
the lake's sums equal the source's.

## Result

- Path: Meltano, a ready Postgres tap and our target in a Fargate task copied 30 of 30 tables equal
  to the source.
- Adapter: copied the kit's Sankhya double through 4 renewals and passed the SDK's 68 tests; a
  generic prototype read HubSpot.
- Money: 200,010 rows sum exactly as at the source (local catalog).

**Not proved.** One adapter on two classes; a real Sankhya copied into the lake (if it fails, this
returns to the founder); exact money inside AWS.

## Consequences

Amends [0069]: copies leave our engine. Amends [0056]: a number `double` would spoil is read as its
source text (`JSON.parse`'s `context.source`), switched on per connector.

## Reopens when

A system's copy cannot be declared as data, or a client asks for a database source.

## State

Accepted 2026-11-21. Founder, 2026-11-19: "A sim"; 2026-11-20: "sim" (the kit for credentials),
"Confirma" (the adapter's tap); 2026-11-21: "G2 a". Amended by [0082](0082-the-lake-holds-tables-and-files.md) and
[0083](0083-money-takes-the-dictionarys-scale-and-rounds-past-it.md).

[0056]: 0056-connectors-kit-and-one-executor.md
[0057]: 0057-connections-by-oauth.md
[0069]: 0069-connectors-one-source-the-kit.md
[0076]: 0076-a-copy-runs-as-a-fargate-task-ending-by-a-queue.md
[0080]: 0080-copy-declared-per-table-raw-appends.md
