# 0034. A second test tool, only for screen files

## Context

The architecture runs every test with one tool directly on the file, and a `.tsx` file does not run that way.

## Decision

Screen files are tested with Vitest, Testing Library and MSW; everything else uses `node:test`. A declared departure from one runner. Basis: Purpose: a screen test runs without a browser.

## Criterion

None written before. Brought from earlier work.

## Result

Neither setup was run on Conexus.

## Consequences

Two tools; test rules hold for both.

## Reopens when

`node:test` runs `.tsx` without bundling, or the second tool costs more than the browser tests it replaces.

## State

Brought. Founder, 2026-10-13: "2. B1".
