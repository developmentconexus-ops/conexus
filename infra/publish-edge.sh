#!/usr/bin/env bash
# Run from the root of a release's checkout, on the server's runner. Publishes the wall, the
# example into the apps' namespace, then the dispatcher, each from that checkout's code. A
# namespace Worker has no versions, so `wrangler rollback` cannot put an app back; the rollback
# publishes the earlier release's code with this same script (C75). Running it again with the same
# code changes nothing.
set -euo pipefail

if [ ! -d apps/edge ]; then
  echo "this release has no apps/edge; the edge stays as it is"
  exit 0
fi

# The token is read by wrangler itself from this file (--env-file), so it is never in a command line,
# in this script's environment or in a log (decision 0042). Only the file's owner may read it.
# CLOUDFLARE_ENV_FILE exists only so scripts/publish-edge.test.ts can plant one.
file="${CLOUDFLARE_ENV_FILE:-/etc/conexus/cloudflare.env}"
if ! [ -f "$file" ] || ! [ -s "$file" ]; then
  echo "missing or empty: $file; write it first (docs/how-to/apps-edge.md)" >&2
  exit 1
fi
case "$(stat --format '%a %U' "$file")" in
  "400 $(id -un)" | "600 $(id -un)") ;;
  *)
    echo "$file must be readable by its owner only, and the owner must be $(id -un)" >&2
    exit 1
    ;;
esac
for name in CLOUDFLARE_API_TOKEN CLOUDFLARE_ACCOUNT_ID; do
  if ! grep --quiet "^$name=." "$file"; then
    echo "$file has no $name" >&2
    exit 1
  fi
done

wrangler="$PWD/node_modules/.bin/wrangler"
cd apps/edge
publish() {
  echo "publishing: $*"
  timeout --kill-after=10 300 "$wrangler" deploy --env-file "$file" "$@"
}
publish --config wrangler.outbound.jsonc
publish --config example/wrangler.jsonc --dispatch-namespace conexus-apps
publish
echo "edge published"
