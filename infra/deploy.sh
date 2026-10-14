#!/usr/bin/env bash
# Keeps no state: the image that runs is read from Docker, so running it again with the same
# image changes nothing.
set -euo pipefail

mode="${1:?usage: deploy.sh <image reference by digest> | deploy.sh --restart}"
cd "$(dirname "$0")"
compose=(docker compose --file compose.yaml)

# Compose needs the variable to read the file, and `ps` does not use its value.
running_image() {
  local id
  id="$(HUB_IMAGE=ps-only "${compose[@]}" ps --quiet hub)"
  if [ -n "$id" ]; then
    docker inspect --format '{{.Config.Image}}' "$id"
  fi
}

migrate_if_labeled() {
  local image="$1"
  if [ "$(docker image inspect --format '{{ index .Config.Labels "conexus.migrate" }}' "$image")" != "1" ]; then
    echo "no migrations in: $image"
    return 0
  fi
  if ! HUB_IMAGE="$image" timeout 60 "${compose[@]}" run --rm migrate; then
    echo "migration failed: $image" >&2
    return 1
  fi
}

previous="$(running_image)"

if [ "$mode" = "--restart" ]; then
  if [ -z "$previous" ]; then
    echo "no Hub is running" >&2
    exit 1
  fi
  migrate_if_labeled "$previous"
  HUB_IMAGE="$previous" "${compose[@]}" up --detach --wait --wait-timeout 90 --force-recreate --no-deps hub
  echo "restarted: $previous"
  exit 0
fi

image="$mode"
if [ "$previous" = "$image" ]; then
  echo "already running: $image"
  exit 0
fi

docker pull --quiet "$image" > /dev/null
migrate_if_labeled "$image"

if HUB_IMAGE="$image" "${compose[@]}" up --detach --wait --wait-timeout 90; then
  echo "live: $image"
  exit 0
fi

echo "not healthy: $image" >&2
if [ -n "$previous" ]; then
  HUB_IMAGE="$previous" "${compose[@]}" up --detach --wait --wait-timeout 90
  echo "back to: $previous" >&2
fi
exit 1
