#!/usr/bin/env bash
# Keeps no state: the image and the Builder's template that run are read from Docker, so running it
# again with the same pair changes nothing. The template travels with the image (a Release builds
# both from one commit); without one, the running Hub's template stays.
set -euo pipefail

usage="usage: deploy.sh <image reference by digest> [<template>] | deploy.sh --restart [<template>]"
mode="${1:?$usage}"
requested_template="${2:-}"
cd "$(dirname "$0")"
compose=(docker compose --file compose.yaml)
# MachineTemplate's rule (apps/server/src/platform/config-machine.ts): E2B's `name:tag`, tag required.
template_pattern='^[a-z0-9][a-z0-9-]{0,62}:[a-z0-9][a-z0-9._-]{0,127}$'

# Compose needs both variables to read the file, and `ps` uses neither value.
running_id() {
  HUB_IMAGE=ps-only HUB_E2B_TEMPLATE=ps-only "${compose[@]}" ps --quiet hub
}

running_template() {
  docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' "$1" | sed -n 's/^HUB_E2B_TEMPLATE=//p'
}

migrate_if_labeled() {
  local image="$1"
  if [ "$(docker image inspect --format '{{ index .Config.Labels "conexus.migrate" }}' "$image")" != "1" ]; then
    echo "no migrations in: $image"
    return 0
  fi
  # Status 75 is `migrate` saying the lock was busy or the connection was lost (MIGRATE_RETRY_EXIT);
  # the migrations are one transaction, so a try again repeats them whole. The 3 attempts and the
  # 10 s pause are strong_migrations' example (lock_timeout_retries 3, lock_timeout_retry_delay 10 s,
  # README.md:1030-1048); here 3 attempts in all. The 120 s is the server's 60 s
  # transaction limit plus the worst boot seen (~8 s), with margin; the server ends the SQL by itself.
  local attempt=1 status
  while true; do
    status=0
    HUB_IMAGE="$image" HUB_E2B_TEMPLATE="$template" timeout 120 "${compose[@]}" run --rm migrate || status=$?
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
  if ! HUB_IMAGE="$image" HUB_E2B_TEMPLATE="$template" timeout 120 "${compose[@]}" run --rm --no-deps hub node apps/server/src/main.ts reseal; then
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
  for name in hub_session_secret hub_mail_token hub_neon_api_key hub_app_login_key hub_cloudflare_apps_token hub_seal_keys hub_mastra_database_url hub_git_copy_key hub_e2b_api_key hub_connector_apps; do
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
id="$(running_id)"
previous=""
previous_template=""
if [ -n "$id" ]; then
  previous="$(docker inspect --format '{{.Config.Image}}' "$id")"
  previous_template="$(running_template "$id")"
fi
template="${requested_template:-$previous_template}"

if [ "$mode" = "--restart" ] && [ -z "$previous" ]; then
  echo "no Hub is running" >&2
  exit 1
fi
if [ -z "$template" ]; then
  echo "no template: name the Builder's template, for no running Hub has one to keep" >&2
  exit 1
fi
if ! [[ $template =~ $template_pattern ]]; then
  echo "not a template name:tag: $template" >&2
  exit 1
fi

if [ "$mode" = "--restart" ]; then
  require_secrets "$previous"
  migrate_if_labeled "$previous"
  reseal_if_labeled "$previous"
  if HUB_IMAGE="$previous" HUB_E2B_TEMPLATE="$template" "${compose[@]}" up --detach --wait --wait-timeout 90 --force-recreate --no-deps hub; then
    echo "restarted: $previous with $template"
    exit 0
  fi
  echo "not healthy after the restart: $previous; run Voltar atrás to start an earlier release" >&2
  exit 1
fi

image="$mode"
if [ "$previous" = "$image" ] && [ "$previous_template" = "$template" ]; then
  echo "already running: $image with $template"
  exit 0
fi

docker pull --quiet "$image" > /dev/null
require_secrets "$image"
migrate_if_labeled "$image"
reseal_if_labeled "$image"

if HUB_IMAGE="$image" HUB_E2B_TEMPLATE="$template" "${compose[@]}" up --detach --wait --wait-timeout 90; then
  echo "live: $image with $template"
  exit 0
fi

echo "not healthy: $image with $template" >&2
if [ -n "$previous" ]; then
  HUB_IMAGE="$previous" HUB_E2B_TEMPLATE="$previous_template" "${compose[@]}" up --detach --wait --wait-timeout 90
  echo "back to: $previous with $previous_template" >&2
fi
exit 1
