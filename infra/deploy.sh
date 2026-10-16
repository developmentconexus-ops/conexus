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

# The secrets folder is root's alone, so Docker reads the file, as the Hub's user, inside the image.
require_secret() {
  local image="$1" name="$2"
  if ! docker run --rm --network none --user 1000 \
    --mount "type=bind,source=/etc/conexus/secrets/$name,target=/run/check,readonly" \
    --entrypoint test "$image" -s /run/check; then
    echo "missing secret: $name; write /etc/conexus/secrets/$name first" >&2
    return 1
  fi
}

require_secrets() {
  local name
  for name in hub_session_secret hub_mail_token; do
    require_secret "$1" "$name"
  done
}

# Compose reads `env_file` itself, as the user that runs this script, and `ps` below needs it too.
# compose.yaml fixes the path; HUB_ENV_FILE exists only so scripts/deploy.test.ts can plant one.
require_hub_env() {
  local file="${HUB_ENV_FILE:-/etc/conexus/hub.env}"
  if ! { : < "$file"; } 2> /dev/null; then
    echo "missing or unreadable hub.env: $file; write it first, readable by $(id -un)" >&2
    return 1
  fi
}

require_hub_env
previous="$(running_image)"

if [ "$mode" = "--restart" ]; then
  if [ -z "$previous" ]; then
    echo "no Hub is running" >&2
    exit 1
  fi
  require_secrets "$previous"
  migrate_if_labeled "$previous"
  if HUB_IMAGE="$previous" "${compose[@]}" up --detach --wait --wait-timeout 90 --force-recreate --no-deps hub; then
    echo "restarted: $previous"
    exit 0
  fi
  echo "not healthy after the restart: $previous; run Voltar atrás to start an earlier release" >&2
  exit 1
fi

image="$mode"
if [ "$previous" = "$image" ]; then
  echo "already running: $image"
  exit 0
fi

docker pull --quiet "$image" > /dev/null
require_secrets "$image"
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
