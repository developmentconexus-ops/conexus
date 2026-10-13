# 0035. Publish a release through a runner on the server

## Context

The Hub goes live, and back, with no server command or open port [0007].

## Decision

Only a GitHub Release of a `main` commit publishes; a merge does not. A server runner starts its image with Compose; "Voltar atrás" starts one of the last ten releases. No secret in GitHub. Basis: Documenso `cd0cc5f` `deploy.yml:1-7`, cal.com `54343aa` `release-docker.yaml` and `draft-release.yml`, and the founder.

## Criterion

**Question.** Do publish and roll back work, with no open port?

**Fixed.** São Paulo server, step 1 versions, GitHub Free.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Publish a release | Live in 10 min, no server command |
| 2 | "Voltar atrás" | Earlier release in 5 min |
| 3 | Release missing a setting | Earlier back in 2 min; red run |
| 4 | Outside port scan | No open TCP port |
| 5 | Kill the program | Back in 1 min |
| 6 | Stop cloudflared | E-mail; delay recorded |
| 7 | `docker events`, three releases | Old Hub dies before new starts |

**Not covered.** Load, server restore.

## Result

Not run.

## Consequences

Any writer can run code as root on the server, as L14 accepts for `main`.

## Reopens when

A check fails, or runners cost money.

## State

Proposed 2026-10-13. Founder, 2026-10-13: "4. a 5A".
