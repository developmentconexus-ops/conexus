#!/usr/bin/env bash
# Run from the root of a release's checkout, on the server's runner. Publishes the wall, the
# example into the apps' namespace, the dispatcher's app login key, then the dispatcher, each from
# that checkout's code. A
# namespace Worker has no versions, so `wrangler rollback` cannot put an app back; the rollback
# publishes the earlier release's code with this same script (C75). Running it again with the same
# code changes nothing.
set -euo pipefail

if [ ! -d apps/edge ]; then
  echo "this release has no apps/edge; the edge stays as it is"
  exit 0
fi

# Refuses a file that is missing, empty, readable by others or owned by another user than the one
# who publishes: each holds a secret only that user may read.
check_owner_file() {
  local file="$1" how="$2"
  if ! [ -f "$file" ] || ! [ -s "$file" ]; then
    echo "missing or empty: $file; write it first ($how)" >&2
    exit 1
  fi
  case "$(stat --format '%a %U' "$file")" in
    "400 $(id -un)" | "600 $(id -un)") ;;
    *)
      echo "$file must be readable by its owner only, and the owner must be $(id -un)" >&2
      exit 1
      ;;
  esac
}

# The token is read by wrangler itself from this file (--env-file), so it is never in a command line,
# in this script's environment or in a log (decision 0042). Only the file's owner may read it.
# CLOUDFLARE_ENV_FILE exists only so scripts/publish-edge.test.ts can plant one.
file="${CLOUDFLARE_ENV_FILE:-/etc/conexus/cloudflare.env}"
check_owner_file "$file" docs/how-to/apps-edge.md
for name in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID; do
  if ! grep --quiet "^$name=." "$file"; then
    echo "$file has no $name" >&2
    exit 1
  fi
done
# The key the apps' login passwords derive from (decision 0043): wrangler reads it on its standard
# input, so it is never in a command line or a log. APP_LOGIN_KEY_FILE exists only for the test.
key="${APP_LOGIN_KEY_FILE:-/etc/conexus/app-login-key}"
check_owner_file "$key" docs/how-to/apps-edge.md

wrangler="$PWD/node_modules/.bin/wrangler"
cd apps/edge
publish() {
  echo "publishing: $*"
  timeout --kill-after=10 300 "$wrangler" deploy --env-file "$file" "$@"
}
publish --config wrangler.outbound.jsonc
publish --config example/wrangler.jsonc --dispatch-namespace conexus-apps
# Before the dispatcher's code, which requires the secret (wrangler.jsonc `secrets.required`).
echo "setting the dispatcher's APP_LOGIN_KEY"
# The Hub trims its file; wrangler keeps every byte it reads, so the newline goes here.
tr -d '\n' < "$key" | timeout --kill-after=10 120 "$wrangler" secret put APP_LOGIN_KEY --env-file "$file"
publish
echo "edge published"
