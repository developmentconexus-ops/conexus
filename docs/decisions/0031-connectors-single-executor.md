# 0031. Connectors through one executor in the Hub

## Context

An app reads a company's system without ever seeing its credential.

## Decision

An app calls `connectors.fetch`; one executor in the Hub holds the credential and makes the read-only call. Basis: Implemented so and decided before; accepted because only an executor on the trusted side makes a query to the company's system read-only.

## Criterion

None written before. Brought from earlier work.

## Result

Nothing of this path ran in a proof.

## Consequences

An app with a connector stops when the server stops.

## Reopens when

Step 20 finds no way for a Worker to reach the Hub.

## State

Superseded by [0056].
