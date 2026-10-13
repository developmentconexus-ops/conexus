# 0017. Invitation e-mail by Cloudflare's e-mail service

## Context

Invitations need outbound e-mail.

## Decision

Cloudflare's own e-mail service sends invitations, with a delivery test before the first company and Resend as the fallback. Basis: The founder's answer, after explanation. The earlier answer was Resend; the change is his.

## Criterion

A delivery test before the first company.

## Result

Not run. The service is in beta, needs the Workers Paid plan, and a new account starts with an unpublished daily quota.

## Consequences

A beta service on the only door in.

## Reopens when

The delivery test fails.

## State

Brought. Founder, 2026-10-12: "Se cloudflare tem e é incluso em nosso plano porque não usar?" and "8. Sim".
