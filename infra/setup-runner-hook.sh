#!/usr/bin/env bash
# Run as root, from a checkout of main. Gives the runner the hook that refuses every job but a release
# or a manual run of main (decision 0035, security S36), installed where the runner cannot change it,
# and jq, which the hook reads the release event with. It reads no token, so it runs again on a
# server already set up; setup-server.sh calls it on a new one. The runner reads its .env when it
# starts, so a runner already installed as a service is restarted.
set -euo pipefail

config_dir=/etc/conexus
home=/home/runner/actions-runner
if [ "${CONEXUS_SETUP_TEST:-}" = 1 ]; then
  config_dir="${CONFIG_DIR:?}"
  home="${RUNNER_HOME:?}"
fi
here="$(dirname "$0")"

limit() { timeout --kill-after=10 "$@"; }

if ! command -v jq > /dev/null; then
  limit 300 apt-get update
  limit 300 apt-get install -y jq
fi
install -d -m 0711 "$config_dir"
install -m 0755 "$here/runner-job-started.sh" "$config_dir/runner-job-started.sh"

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
echo "runner hook ready"
