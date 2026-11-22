#!/usr/bin/env bash
# The runner calls this before the first step of every job (ACTIONS_RUNNER_HOOK_JOB_STARTED), and a
# job whose hook fails never starts a step. So only a push or a manual run of main whose commit is on
# main reach the token of the edge and the Hub's keys; a release, a tag, another branch, a pull request
# or a commit outside main ends here (decisions 0035 and 0081, security S36).
#
# The commit is checked, not only the name: main comes from a bare mirror of GitHub's main on this
# server, fetched first, anonymously over HTTPS from the public repository; a missing mirror or a
# failed fetch refuses.
# The runner passes the hook no argument, so the first one exists only for scripts/runner-hook.test.ts.
set -euo pipefail

mirror="${1:-/var/lib/conexus/main.git}"

refuse() {
  echo "refused: $1" >&2
  exit 1
}

case "${GITHUB_EVENT_NAME:-}" in
  workflow_dispatch)
    [ "${GITHUB_REF:-}" = refs/heads/main ] || refuse "a manual run of ${GITHUB_REF:-no ref} is not main"
    ;;
  push)
    [ "${GITHUB_REF:-}" = refs/heads/main ] || refuse "a push to ${GITHUB_REF:-no ref} is not main"
    ;;
  *)
    refuse "a '${GITHUB_EVENT_NAME:-}' event does not reach this runner"
    ;;
esac

commit="${GITHUB_SHA:-}"
[[ $commit =~ ^[0-9a-f]{40}$ ]] || refuse "'$commit' is not a commit"
[ -d "$mirror" ] || refuse "no mirror of main at $mirror"
git=(env -i PATH="$PATH" HOME="${HOME:-/}" GIT_TERMINAL_PROMPT=0 git --git-dir="$mirror")
timeout --kill-after=5 60 "${git[@]}" fetch --quiet --no-tags origin refs/heads/main:refs/heads/main \
  > /dev/null 2>&1 || refuse "could not fetch main into $mirror"
"${git[@]}" merge-base --is-ancestor "$commit" refs/heads/main > /dev/null 2>&1 \
  || refuse "the commit $commit is not on main"
