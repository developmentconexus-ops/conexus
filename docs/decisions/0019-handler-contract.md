# 0019. The generated app's handler contract

## Context

Every generated app is written against one contract.

## Decision

`handler(input, { db, caller, connectors })`, versioned in `packages/app-contract`. A fourth object is a change of contract. An app declares zero or more operations, in Zod ([0055](0055-apps-on-the-platform-contract.md)): the manifests of before stay valid, their `operations` accepted and not read, and a page without a server is an app. Basis: Implemented so and only tested so; accepted because it would be chosen again: with one login per app, PostgreSQL refuses, without trusting the Builder.

## Criterion

None written before. Brought from earlier work.

## Result

A real app's source ran unchanged on the new path: 9 of 9 cases answered as before.

## Consequences

Changing it regenerates every app.

## Reopens when

A real app needs an interactive transaction.

## State

Brought. Kept from the old code.
