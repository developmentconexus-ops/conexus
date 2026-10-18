# 0041. The app session check asks the Hub through Workers VPC

## Context

Step 8 opens a Projeto's app on its own host of the apps' domain [0023] [0024]. Every call to an
app is checked against the Hub, which holds the people, the companies and the Projetos [0025].
The dispatcher runs on Cloudflare; the Hub runs on the server behind its Tunnel [0007].

## Decision

The dispatcher reaches a second Hub listener, `hub:8081`, through a Workers VPC service over the
existing Tunnel, with no public address and no shared secret. The listener serves only the edge
routes. The way out, 4B, is a public Tunnel hostname behind Cloudflare Access with a service token.
Basis: founder's answer 4A, "sua recomendação vale a pena validarmos".

## Criterion

**Question.** Does Workers VPC carry the check, and does the rest of the edge hold as the card
writes it?

**Fixed.** Newest `wrangler`, the Conexus account, the apps' zone, the server's Tunnel in QUIC, a
`docker run --rm` container on the Compose network with no published port. Every name `cx-prova-`.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Dispatcher with `dispatch_namespaces` to `cx-prova-borda:8081` by VPC | It answers |
| 2 | 8081 by any public address | Nothing answers |
| 3 | App's `fetch`, `connect`, WebSocket | The wall refuses each |
| 4 | `limits.cpu_ms` 50 at upload, a loop | Cut in under 3 s |
| 5 | Certificates | Valid on `x.<domain>`, none on `a.b.<domain>` |
| 6 | `ctx.props` | Reaches the app |
| 7 | LT13 in headless Chromium | The app's page reaches neither the Hub nor a sibling's `__Host-` cookies |
| 8 | Times through VPC, first and warm | Give `HUB_CHECK_DEADLINE_MS` |

If 1 or 2 fails, step 8 returns to the founder with 4B.

**Not covered.** The real Hub (step 8's U7), load.

## Result

Not run.

## Reopens when

Workers VPC changes or leaves beta, or step 18 moves the check [0025].

## State

Proposed 2026-10-18. Founder: 4A.
