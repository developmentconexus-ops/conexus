# 0044. The release image is built on a GitHub-hosted machine

## Context

[0035] put every Publish job on the server's runner. On 2026-10-18 the repository became public,
and CI left the local runners for GitHub-hosted machines.

## Decision

Publish's `image` job runs on GitHub-hosted `ubuntu-24.04`, a new machine per job, so nothing
another job left behind reaches main's image. It checks that the commit is on `main`, pushes the
image and keeps the last ten versions. Only its digest crosses to the server's hooked runner, whose
`deploy` and `edge` jobs deploy that digest and record it for Voltar atrás. Basis: the founder's
answer A.

## Criterion

None written before. Built in step 8.

## Result

Release v0.8.0, run 39143390404, 2026-10-18: the image built on GitHub, then the Hub and the edge
deployed by the server's runner. It passed once the `conexus-hub` package's Actions access gave
this repository the Admin role; with Write, deleting old versions failed with "Package not found".

## Consequences

Hosted minutes are free for a public repository, so the trigger of [0035], runners that cost money,
is not reached. GitHub warns against self-hosted runners in a public repository; the founder
accepts it, with the server's runner reached only through its hook and the `production`
environment.

## Reopens when

The repository turns private, or hosted minutes cost money.

## State

Accepted 2026-10-18. Founder: "A" (the image on GitHub) and "Stop local runner move to github and
continue"; the warning accepted with the public repository.
