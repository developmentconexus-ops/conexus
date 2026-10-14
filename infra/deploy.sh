#!/usr/bin/env bash
# Puts the given Hub image live, or leaves the Hub as it was. Keeps no state: the image that runs is
# read from Docker, so running it again with the same image changes nothing.
set -euo pipefail

image="${1:?usage: deploy.sh <image reference by digest>}"
cd "$(dirname "$0")"
compose=(docker compose --file compose.yaml)

running_image() {
  local id
  id="$(HUB_IMAGE="$image" "${compose[@]}" ps --quiet hub)"
  if [ -n "$id" ]; then
    docker inspect --format '{{.Config.Image}}' "$id"
  fi
}

previous="$(running_image)"
if [ "$previous" = "$image" ]; then
  echo "already running: $image"
  exit 0
fi

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
