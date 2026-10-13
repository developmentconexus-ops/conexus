# 0035. Publish and roll back through a runner on the server

## Context

A merge goes live, and one button brings the previous image back, with no command on the server and no open port [0007].

## Decision

Hosted runners build the image; a GitHub runner on the server starts it with Compose; a "Voltar atrás" workflow starts the previous one. No secret lives in GitHub. Basis: purpose. Risk: on GitHub Free any writer can run a workflow on that runner, as L14 accepts for `main`.

## Criterion

**Question.** Does the server publish and roll back alone, with no open port?

**Fixed.** The São Paulo server, the versions of step 1's card, GitHub Free.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Merge into `main` | New version live within 10 min, no server command |
| 2 | "Voltar atrás" | Previous version within 5 min |
| 3 | Image missing a setting | Previous version answers; run red |
| 4 | Outside port scan | No open TCP port |
| 5 | Kill the program | Back within 1 min |
| 6 | Stop cloudflared | Cloudflare e-mail arrives; delay recorded |
| 7 | `docker ps` while publishing | Never two Hub containers |

**Not covered.** A hang, load, restoring the server.

## Result

Not run.

## Reopens when

A check fails, or self-hosted minutes stop being free.

## State

Proposed 2026-10-13.
