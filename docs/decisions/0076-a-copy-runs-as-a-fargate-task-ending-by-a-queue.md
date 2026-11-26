# 0076. A copy runs as a Fargate task, and its end arrives by a queue

## Context

A Singer tap runs in its own process [0071]: the Hub must start it, learn its end and never lose
a run. A copy ran in the Hub under a lease ([data D25](../guides/data.md)).

## Decision

- The Hub's clock only says when, counted from the copy's creation; the call "Rodar agora" uses
  starts one Fargate task per run. One task definition; the write role passes per run.
- The database holds one open run per copy; a second start answers "already running".
- The task sends its own result to an SQS queue; ECS reports the task's stop to the same queue. A
  sweep at each start closes what was left open.
- The task checks its run at each batch and stops once it is closed.
- No lease. The start token is run plus attempt, at most 64 characters.
- The run holds the machine size: 2 vCPU, 4 GB for a first load; 1 vCPU, 2 GB later. Case: 30
  tables in 180 s on 2 vCPU, 588 s on 1.

## Criterion

From the root-cause study of 2026-11-20: every ending closes the run once, truly, and the next
start opens.

## Result

- 22 tests against a local database with `main`'s run tables.
- On real AWS, 19 scenarios, each run twice or more, closed alike each time; the stop notice
  took about 24 s; an orphan task stopped in 4.6 to 7.4 s.

**Not proved:** the orphan's last batch. Real Meltano runs closed, and AWS refused none of ten
parameter writes.

## Consequences

Rewrites D25. Amends [0058]: the task is its second process; the per-app limit becomes a ceiling
of open runs per connector, proved with the second connector class.

## Reopens when

A run closes with a false end, or stays open past the sweep.

## State

Accepted 2026-11-20. Founder: D "c" (the end by a queue); "Okay" (D25). Amended 2026-11-23:
"(a) Hub, só o 'quando'"; "2 vCPU na primeira carga".

[0058]: 0058-provider-limits-and-queues.md
[0071]: 0071-connectors-kit-live-copies-singer.md
