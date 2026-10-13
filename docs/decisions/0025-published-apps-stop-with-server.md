# 0025. Published apps stop when the server stops

## Context

An app's call still asks the server for the session check.

## Decision

Published apps stop while the server is down. Basis: The founder's answer, after explanation.

## Criterion

None written before. Brought from earlier work.

## Result

With the server stopped, no app answered.

## Consequences

Apps are down at every restart.

## Reopens when

Step 18, where the session check finds its place.

## State

Brought. Founder, 2026-10-11: "13. Aceitar e antar".
