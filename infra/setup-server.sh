#!/usr/bin/env bash
# Run as root. Each token is read from a file only root can read, named by TUNNEL_TOKEN_FILE and
# RUNNER_TOKEN_FILE. The runner reads its registration token only from a command line, from its
# environment or from a terminal prompt, never from a file (decision 0036): the token is set in the
# environment of the config.sh call alone, never exported to this script and never in a command line.
set -euo pipefail

: "${RUNNER_URL:?RUNNER_URL is required}"
: "${TUNNEL_TOKEN_FILE:?TUNNEL_TOKEN_FILE is required}"
: "${RUNNER_TOKEN_FILE:?RUNNER_TOKEN_FILE is required}"
RUNNER_VERSION="${RUNNER_VERSION:?RUNNER_VERSION is required, a version of github.com/actions/runner}"
RUNNER_SHA256="${RUNNER_SHA256:?RUNNER_SHA256 is required, the checksum from that version release note}"

secrets="${SECRETS_DIR:-/etc/conexus/secrets}"
docker_list="${DOCKER_APT_LIST:-/etc/apt/sources.list.d/docker.list}"
home="${RUNNER_HOME:-/home/runner/actions-runner}"
cloudflared_uid=65532

# Every command that can wait on the network or on a prompt has a deadline and is killed after it.
limit() { timeout --kill-after=10 "$@"; }
fetch=(curl --fail --silent --show-error --location --connect-timeout 10 --max-time 120)

# Refuses a secret file that is empty, or that anyone but its owner can read.
check_secret_file() {
  local file="$1"
  [ -f "$file" ] && [ -s "$file" ] || { echo "$file is missing or empty" >&2; exit 1; }
  case "$(stat --format %a "$file")" in
    400|600) ;;
    *) echo "$file must be readable by its owner only" >&2; exit 1 ;;
  esac
}
check_secret_file "$TUNNEL_TOKEN_FILE"
check_secret_file "$RUNNER_TOKEN_FILE"

if ! command -v docker >/dev/null; then
  limit 300 apt-get update
  limit 600 apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  "${fetch[@]}" https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  # shellcheck disable=SC1091
  . /etc/os-release
  echo "deb [signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > "$docker_list"
  limit 300 apt-get update
  limit 900 apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin
fi

install -d -m 0700 /etc/conexus "$secrets"
install -m 0400 -o "$cloudflared_uid" "$TUNNEL_TOKEN_FILE" "$secrets/tunnel_token"

id runner >/dev/null 2>&1 || useradd --create-home --shell /usr/sbin/nologin runner
usermod -aG docker runner

install -d -o runner -g runner "$home"
cd "$home"
if [ ! -x ./run.sh ]; then
  "${fetch[@]}" -o runner.tar.gz \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
  echo "${RUNNER_SHA256}  runner.tar.gz" | sha256sum --check -
  sudo -u runner tar xzf runner.tar.gz
  rm runner.tar.gz
fi
if [ ! -f .runner ]; then
  ACTIONS_RUNNER_INPUT_TOKEN="$(cat "$RUNNER_TOKEN_FILE")" \
    limit 120 sudo --preserve-env=ACTIONS_RUNNER_INPUT_TOKEN -u runner ./config.sh --unattended \
    --url "$RUNNER_URL" --labels hub --name hub --replace
fi
limit 60 ./svc.sh install runner
limit 60 ./svc.sh start
echo "server ready"
