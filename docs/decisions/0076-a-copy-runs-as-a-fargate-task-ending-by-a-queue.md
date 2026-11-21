# 0076. A copy runs as a Fargate task, and its end arrives by a queue

## Context

Today a copy runs inside the Hub under a lease ([data D25](../guides/data.md)). A
Singer tap runs in its own process [0071]: the Hub must start it, learn its end and never lose a run.

## Decision

- The Hub's clock starts a Fargate task per run: one task definition for all companies, the
  company's write role passed per run.
- The database holds one open run per copy; a second start answers "already running".
- The task sends its own result to an SQS queue; ECS reports the task's stop to the same queue. A
  sweep at each start closes what was left open.
- The task checks its run at each batch and stops once it is closed.
- No lease. The start token is run plus attempt, within 32 characters.
- Machine size is data of the run; 2 vCPU starts the first load. Case: 30 tables in 180 s on 2 vCPU,
  588 s on 1.

## Criterion

From the root-cause study of 2026-11-20: every ending closes the run once, truly, and the next
start opens.

## Result

- 22 tests against a local database with `main`'s run tables.
- On real AWS, 19 scenarios, each run twice or more, closed alike each time; the stop notice
  took about 24 s; an orphan task stopped in 4.6 to 7.4 s.

**Not proved.** Real Meltano in the end path (a script stood in); the orphan's last batch; the
parameter store's 3 writes per second per account.

## Consequences

D25 is rewritten by its reason in the method change, with no exception; nothing here is built
before it. Amends [0058]: the task is its second process; the per-app limit becomes a ceiling of
open runs per connector, proved with the second connector class.

## Reopens when

A run closes with a false end, or stays open past the sweep.

## State

Accepted 2026-11-20. Founder: D "c" (the end by a queue); "Okay" (D25 rewritten, no exception).

[0058]: 0058-provider-limits-and-queues.md
[0071]: 0071-connectors-kit-live-copies-singer.md
