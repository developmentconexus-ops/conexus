#!/usr/bin/env bash
# Run as root, from a checkout of main. Gives the runner the hook that refuses every job but a release
# or a manual run of main whose commit is on main (decision 0035, security S36), and git, which the
# hook checks the commit with. The hook file is root's, so a job cannot change it; the runner's .env
# that names it, and the mirror of main the hook fetches into, stay the runner's, so only a job the
# hook already let through could change them (and the runner, in the docker group, holds root anyway).
#
# The mirror is fetched anonymously over HTTPS, since the repository is public. Given MIRROR_URL
# (https://github.com/<owner>/<repo>.git), this prepares the mirror; without it, it leaves the
# mirror as it is, and with no mirror the hook refuses every job. It reads no token, so it runs
# again on a server already set up; setup-server.sh calls it on a new one. The runner reads its .env
# when it starts, so a runner already installed as a service is restarted.
#
# The runner's .env naming the hook is written, and the service restarted, before the mirror, so a
# failed mirror step leaves a runner whose hook refuses every job, never an unguarded runner. The
# releases directory is the runner's too: infra/releases.sh records there what main's Publish deployed.
set -euo pipefail

config_dir=/etc/conexus
home=/home/runner/actions-runner
mirror=/var/lib/conexus/main.git
releases=/var/lib/conexus/releases
if [ "${CONEXUS_SETUP_TEST:-}" = 1 ]; then
  config_dir="${CONFIG_DIR:?}"
  home="${RUNNER_HOME:?}"
  mirror="${MIRROR_DIR:?}"
  releases="${RELEASES_DIR:?}"
fi
here="$(dirname "$0")"

limit() { timeout --kill-after=10 "$@"; }

if ! command -v git > /dev/null; then
  limit 300 apt-get update
  limit 300 apt-get install -y git
fi
install -d -m 0711 "$config_dir"
install -m 0755 "$here/runner-job-started.sh" "$config_dir/runner-job-started.sh"

# Runs before the mirror (see the header); in a subshell, so the mirror step keeps its directory.
name_the_hook() (
  cd "$home"
  {
    { grep --invert-match '^ACTIONS_RUNNER_HOOK_JOB_STARTED=' .env 2> /dev/null || true; }
    echo "ACTIONS_RUNNER_HOOK_JOB_STARTED=$config_dir/runner-job-started.sh"
  } > .env.next
  chown runner:runner .env.next
  mv .env.next .env
  # svc.sh writes .service when it installs the runner as a service.
  if [ -f .service ]; then
    limit 60 ./svc.sh stop
    limit 60 ./svc.sh start
  fi
)
name_the_hook
install -d -o runner -g runner -m 0700 "$releases"

if [ -n "${MIRROR_URL:-}" ]; then
  [[ $MIRROR_URL =~ ^https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\.git$ ]] || {
    echo "MIRROR_URL must be https://github.com/<owner>/<repo>.git" >&2
    exit 1
  }
  install -d -m 0755 "$(dirname "$mirror")"
  install -d -o runner -g runner -m 0700 "$mirror"
  as_runner() { sudo -u runner git --git-dir="$mirror" "$@"; }
  [ -f "$mirror/HEAD" ] || as_runner init --quiet --bare --initial-branch=main
  as_runner config remote.origin.url "$MIRROR_URL"
  limit 60 sudo -u runner git --git-dir="$mirror" fetch --no-tags origin refs/heads/main:refs/heads/main
  echo "mirror of main ready"
elif ! [ -f "$mirror/HEAD" ]; then
  echo "no mirror of main at $mirror: the hook refuses every job until MIRROR_URL is given (docs/how-to/apps-edge.md)" >&2
fi

echo "runner hook ready"
