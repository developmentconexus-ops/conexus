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
  # Status 75 is `migrate` saying the lock was busy or the connection was lost, and nothing was
  # applied (MIGRATE_RETRY_EXIT). The attempts and the pause are strong_migrations' example
  # (lock_timeout_retries 3, lock_timeout_retry_delay 10 s). The 120 s is the server's 60 s
  # transaction limit plus the worst boot seen (~8 s), twice over; the server ends the SQL by itself.
  local attempt=1 status
  while true; do
    status=0
    HUB_IMAGE="$image" timeout 120 "${compose[@]}" run --rm migrate || status=$?
    if [ "$status" -eq 0 ]; then
      return 0
    fi
    if [ "$status" -ne 75 ] || [ "$attempt" -ge 3 ]; then
      echo "migration failed: $image" >&2
      return 1
    fi
    echo "migration will be tried again: attempt $attempt of 3 did not finish" >&2
    sleep "${MIGRATE_RETRY_SECONDS:-10}"
    attempt=$((attempt + 1))
  done
}

# After migrate: every model account's credential moves to the seal key file's last line (S32).
# A release before step 11 has no reseal command, so Voltar atrás to it skips this (0035).
reseal_if_labeled() {
  local image="$1"
  if [ "$(docker image inspect --format '{{ index .Config.Labels "conexus.reseal" }}' "$image")" != "1" ]; then
    echo "no reseal in: $image"
    return 0
  fi
  if ! HUB_IMAGE="$image" timeout 120 "${compose[@]}" run --rm --no-deps hub node apps/server/src/main.ts reseal; then
    echo "reseal failed: $image" >&2
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
  for name in hub_session_secret hub_mail_token hub_neon_api_key hub_app_login_key hub_cloudflare_apps_token hub_seal_keys hub_mastra_database_url hub_git_copy_key hub_e2b_api_key; do
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
  reseal_if_labeled "$previous"
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
reseal_if_labeled "$image"

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
