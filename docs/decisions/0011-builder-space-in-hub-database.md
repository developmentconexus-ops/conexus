# 0011. Runs and model accounts in the Hub's database

## Context

The Builder's runs and model accounts must change in the same transaction as Hub records.

## Decision

Runs and model accounts live in the Hub's database, in a schema of the Builder's own. Basis: Purpose: creating a run and delivering the app are one step.

## Criterion

None written before. Brought from earlier work.

## Result

Not run.

## Consequences

If the Builder becomes its own program, those steps are split.

## Reopens when

The Builder leaves the program [0006].

## State

Brought. Founder, 2026-10-12: "3. Sim".
