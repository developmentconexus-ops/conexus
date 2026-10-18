#!/usr/bin/env bash
# The runner calls this before the first step of every job (ACTIONS_RUNNER_HOOK_JOB_STARTED), and a
# job whose hook fails never starts a step. So only a release of a commit on main and a manual run
# of main reach the token of the edge and the Hub's keys; a push, another branch or a pull request
# ends here (decision 0035, security S36).
set -euo pipefail

refuse() {
  echo "refused: $1" >&2
  exit 1
}

case "${GITHUB_EVENT_NAME:-}" in
  workflow_dispatch)
    [ "${GITHUB_REF:-}" = refs/heads/main ] || refuse "a manual run of ${GITHUB_REF:-no ref} is not main"
    ;;
  release)
    event="${GITHUB_EVENT_PATH:-}"
    { : < "$event"; } 2> /dev/null || refuse "the release event file is missing or unreadable"
    target="$(jq --raw-output '.release.target_commitish // empty' "$event" 2> /dev/null)" || refuse "the release event is not JSON"
    [ "$target" = main ] || refuse "the release targets '$target', not main"
    ;;
  *)
    refuse "a '${GITHUB_EVENT_NAME:-}' event does not reach this runner"
    ;;
esac
