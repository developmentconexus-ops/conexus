# 0069. Connectors: one source, our kit

## Context

[0056] put every connector in the kit behind one executor. The roadmap and the Data track page then
added H5: the Nango for what it has, the kit for the rest, and a connector factory that wrote
Nango functions. The founder asked which source runs a connector and chose one, on the night of
2026-11-14.

## Decision

- One source of connectors: the kit `@conexus/connectors`.
- Authorization login, token storage and renewal stay in the kit, with our login app in each system.
- The Nango stays out of the code. It is a reference for patterns only (link lifetime, credential
  fields, authorization and token pages).
- The connector factory writes kit definitions. The AI writes each from the system's API
  documentation, and a test read checks it.
- This replaces H5.

## Criterion

| # | Check | Passes when |
| --- | --- | --- |
| 1 | The workspaces' `package.json` files and imports | None names a Nango package or calls its API |
| 2 | A new system's definition | It passes the kit's conformance and one test read |

## Result

Not proved: no connector is built from documentation yet.

## Consequences

The Nango's prebuilt operations, which run only on its paid plan, are not used. A copy has one
engine. A new system costs a definition and its test read.

## Reopens when

A system's API cannot be declared as data in the kit, or the factory's definitions fail the test
read more often than a person's do.

## State

Accepted 2026-11-14. Founder, choosing among the options for the source of connectors (the option
label is a retired process name, so it is not quoted): one source only, our kit, with the Nango out
of the code and kept as a pattern reference. It replaces H5. Builds on [0056]. Amended 2026-11-21
by [0071]: copies left our own copy engine for Singer taps.

[0056]: 0056-connectors-kit-and-one-executor.md
[0071]: 0071-connectors-kit-live-copies-singer.md
