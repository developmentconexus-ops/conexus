# 0042. The Cloudflare publish token reaches wrangler in one call's environment

## Context

Security S31 asks every secret to be read from a file. The Release publishes the edge from the server's runner [0035] with `wrangler deploy`, which authenticates only with `CLOUDFLARE_API_TOKEN` read from its process environment (`wrangler` 4.151.1: no option takes a token file; `wrangler deploy --help` lists `--env-file`, a path). The card expected an exception like 0036. The installed `wrangler` bundle shows none is needed: at startup it passes the files named by `--env-file` to `loadDotEnv` and replaces its own `process.env` with the result, and the Cloudflare client reads `CLOUDFLARE_API_TOKEN` from there (C75).

## Decision

No exception to S31. The token and the account id sit in `/etc/conexus/cloudflare.env`, owned by the runner's user, mode 0400 or 0600. `infra/publish-edge.sh` refuses a file that is missing, empty, readable by others, owned by another user or without either key, and passes only its path to each `wrangler deploy --env-file`. The token is in no command line, in no environment of the script or the workflow, and in no log. Basis: the evidence above and the founder's answer.

Lost: the 0036 form, a reader that sets the variable in the call (the same effect, but the value would pass through the shell). If a later `wrangler` stops loading its credentials from `--env-file`, the 0036 form returns as an exception and this record reopens.

## Consequences

The runner's user can read the token, so any job that runs there can; the hook `infra/runner-job-started.sh` is what keeps pull requests, pushes and other branches away from it (S36, L14).

## Reopens when

`wrangler` changes how `--env-file` reaches authentication, or a second Cloudflare credential is needed on the server.

## State

Proposed 2026-10-18. Founder, 2026-10-17: "A", the server's runner publishes the edge.
