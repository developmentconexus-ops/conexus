# 0018. Generated apps run on Cloudflare Workers for Platforms

## Context

Generated code is untrusted and must run without secrets or network, close to Cloudflare's edge.

## Decision

Each app version is a Worker in a Workers for Platforms namespace, with its screen files inside, no binding and no secret. A dispatcher of ours calls it; an outbound Worker refuses its network. Basis: Purpose for the family: four options compared. Only tested so inside it; accepted because the nearest alternative, Dynamic Workers, is beta. Screen files inside the Worker: decided before, accepted as the platform's native form.

## Criterion

None written before. Brought from earlier work.

## Result

The app sees only `caller` and an opaque `db`; 16 attempts to make the capability answer for another app failed; `fetch`, sockets and WebSocket were refused.

## Consequences

Apps depend on Cloudflare; no local adapter exists.

## Reopens when

An isolation failure, or a price change.

## State

Brought. Founder, 2026-10-13: "1. A".
