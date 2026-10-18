# 0041. The app session check asks the Hub through Workers VPC

## Context

Every call to a Projeto's app [0024] is checked against the Hub [0025], behind the server's
Tunnel [0007].

## Decision

The dispatcher reaches a second Hub listener, `hub:8081`, by a Workers VPC service over the
Tunnel: no public address, no shared secret. The way out, 4B: a Tunnel hostname behind Access with a
service token. Basis: founder's answer 4A.

## Criterion

**Fixed.** Newest `wrangler`, the apps' zone, a container on the Compose network, no published
port; names `cx-prova-`.

| # | Check | Passes when |
| --- | --- | --- |
| 1 | Dispatcher to `cx-prova-borda:8081` by VPC | It answers |
| 2 | 8081 by a public address | Nothing answers |
| 3 | App's `fetch`, `connect`, WebSocket | The wall refuses each |
| 4 | `limits.cpu_ms` 50 at upload, a loop | Cut under 3 s |
| 5 | Certificates | On `x.<domain>`, not `a.b.<domain>` |
| 6 | `ctx.props` | Reaches the app |
| 7 | LT13, headless Chromium | Hub and siblings' `__Host-` cookies unreached |
| 8 | VPC times | Give `HUB_CHECK_DEADLINE_MS` |

If 1 or 2 fails, step 8 returns to the founder with 4B. **Not covered.** The real Hub, load.

## Result

2026-10-18, `wrangler` 4.151.1. 1: 200. 2: timed out; ingress has only `hub:8080`. 3:
`fetch`, WebSocket 403; `connect` threw (the dispatcher's read `SSH-2.0`). 4: 2.1 s. 5:
valid on `x.`, `pedidos--empresa-a.`; none on `a.b.`. 6: `{caller}` arrived. 7: CSP blocked
inline script and both fetches; forged `__Host-` cookies refused. 8: first 72–119 ms, warm
31–40 ms. The API then listed no `cx-prova-` Worker, namespace, VPC service, DNS record or route;
the server, no container.

## Consequences

`HUB_CHECK_DEADLINE_MS` is 5,000: VPC 0.1 s, the sleeping database up to 1.6 s [0009]. A plain
cookie on the apps' domain reaches siblings (step 18). Web Analytics stays off: its beacon
breaks the CSP.

## Reopens when

Workers VPC changes, or step 18 moves the check.

## State

Proposed 2026-10-18. Founder: 4A.
