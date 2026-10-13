# 0004. Fastify serves the Hub

## Context

The Hub needs a request library; the old code used Fastify.

## Decision

The Hub runs on Fastify. Mastra enters through its official Fastify adapter. Basis: Implemented so. A tie, kept because it is done, chosen knowing that.

## Criterion

None written before. Brought from earlier work.

## Result

Nothing new measured.

## Consequences

The Fastify maintainers' skill applies; where it disagrees with Conexus (configuration, test runner, logs) the guides decide.

## Reopens when

A required feature is missing in Fastify or in Mastra's adapter for it.

## State

Brought. Founder, 2026-10-13: "3. A".
