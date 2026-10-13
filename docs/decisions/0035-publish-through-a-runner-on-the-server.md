# 0035. Publish and roll back through a runner on the server

## Context

A merge goes live, and one button brings the previous image back, with no server command or open port [0007].

## Decision

Hosted runners build the image; a GitHub runner on the server starts it with Compose; a "Voltar atrás" workflow starts the previous one. No secret lives in GitHub. Basis: purpose.

## Criterion

**Question.** Does the server publish and roll back alone, with no open port?

**Fixed.** São Paulo server, step 1's versions, GitHub Free.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Merge into `main` | Live within 10 min, no server command |
| 2 | "Voltar atrás" | Previous within 5 min |
| 3 | Image missing a setting | Previous answers within 2 min; run red |
| 4 | Outside port scan | No open TCP port |
| 5 | Kill the program | Back within 1 min |
| 6 | Stop cloudflared | Cloudflare e-mail; delay recorded |
| 7 | `docker events`, three publishes | Old Hub dies before new starts |

**Not covered.** A hang, load, restoring the server.

## Result

Not run.

## Consequences

On GitHub Free any writer can run code as root on the server, reading the tunnel token, as L14 accepts for `main`.

## Reopens when

A check fails, or runner minutes cost money.

## State

Proposed 2026-10-13.
