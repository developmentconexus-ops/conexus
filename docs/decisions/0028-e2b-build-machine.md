# 0028. E2B is the build machine

## Context

The Builder compiles and tests apps outside the server.

## Decision

E2B machines compile and test, under a key used by this installation only, with E2B's own outbound blocking by domain. Basis: Implemented so and decided before; accepted for pause and resume, and because changing later is cheap.

## Criterion

None written before. Brought from earlier work.

## Result

Two turns used two machines, each carrying only its own conversation's id. A shared key let another installation's cleanup delete a machine.

## Consequences

One key for all companies of this installation.

## Reopens when

Price, or a machine reaching another.

## State

Brought. Kept from the old code.
