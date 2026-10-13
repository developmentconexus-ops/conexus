# 0027. Mastra is the Builder's engine; the run engine is ours

## Context

Four agent engines were tried for real before Mastra.

## Decision

The Builder is Mastra's agent, configured and not rebuilt. The run engine, one run per Project that moves a Git reference, is Conexus code. Basis: Implemented so and only tested so; accepted after four engines tried, and because Mastra has no run engine of this kind.

## Criterion

None written before. Brought from earlier work.

## Result

A real turn ran with the database on Neon.

## Consequences

Mastra's agent controller is beta; the version is pinned.

## Reopens when

An update breaks the controller, or Mastra ships a run engine that fits.

## State

Brought. Kept from the old code.
