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

Run 2026-10-14. Checks 1, 2 and 4 to 7 pass: each release live in 60 to 80 s; back in 13 s; no open port once SSH closed; the killed process back in about 1 s (`docker kill` is a manual stop, which `unless-stopped` never restarts); the e-mail 4 to 5 min after the tunnel stopped; the old Hub dies first. Check 3 ran on the server only, the earlier image back 9 s after a broken one failed; its red release run is owed by step 2.

## Consequences

Any writer can run code as root on the server, as L14 accepts for `main`.

## Reopens when

A check fails, or runners cost money.

## State

Proposed 2026-10-13. Founder, 2026-10-13: "4. a 5A". Accepted 2026-10-14, when the founder used it: "Deu certo".
