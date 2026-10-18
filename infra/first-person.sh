#!/usr/bin/env bash
# Run as root on the server, from a checkout of main: creates a new installation's first person with
# the running Hub's image and prints the one-use link to this terminal alone. No workflow runs it:
# with the repository public, a run's inputs and summary are public (founder, 2026-10-18). The
# command writes the link to stdout and its own log lines to stderr; `run --rm` keeps no log.
set -euo pipefail

name="${1:?usage: first-person.sh <name> <e-mail>}"
email="${2:?usage: first-person.sh <name> <e-mail>}"
cd "$(dirname "$0")"
compose=(docker compose --file compose.yaml)

# Compose needs the variable to read the file, and `ps` does not use its value.
id="$(HUB_IMAGE=ps-only "${compose[@]}" ps --quiet hub)"
if [ -z "$id" ]; then
  echo "no Hub is running" >&2
  exit 1
fi
image="$(docker inspect --format '{{.Config.Image}}' "$id")"
HUB_IMAGE="$image" timeout 120 "${compose[@]}" run --rm --no-deps -T hub \
  node apps/server/src/main.ts first-person --name "$name" --email "$email" --summary /dev/stdout
