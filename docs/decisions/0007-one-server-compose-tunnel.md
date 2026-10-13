# 0007. One server in São Paulo, with Compose and the Tunnel

## Context

The Hub needs one place to run for a handful of companies.

## Decision

A rented server in São Paulo runs the image built by GitHub Actions, with Compose, behind the Cloudflare Tunnel. The server opens no port. Basis: Purpose for one machine: about fifteen hosts compared by reading. Compose and Actions: implemented so and decided before; the Tunnel: decided before, one option each. Accepted because changing them is cheap.

## Criterion

None written before. Brought from earlier work.

## Result

Not run. Step 1 shows publishing by release, rolling back and the down alert [0035].

## Consequences

Everything stops when the server stops [0025].

## Reopens when

The server's provider fails the publish or restore rehearsal, or load needs a second machine.

## State

Brought. From the cloud study of 2026-10-09.
