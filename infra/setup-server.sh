#!/usr/bin/env bash
# Run as root; the Cloudflare tunnel token comes on standard input so it never reaches a command line.
set -euo pipefail

: "${RUNNER_URL:?RUNNER_URL is required}"
: "${RUNNER_TOKEN:?RUNNER_TOKEN is required}"
RUNNER_VERSION="${RUNNER_VERSION:?RUNNER_VERSION is required, a version of github.com/actions/runner}"
RUNNER_SHA256="${RUNNER_SHA256:?RUNNER_SHA256 is required, the checksum from that version release note}"

secrets=/etc/conexus/secrets
cloudflared_uid=65532

if ! command -v docker >/dev/null; then
  apt-get update
  apt-get install -y ca-certificates curl
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  # shellcheck disable=SC1091
  . /etc/os-release
  echo "deb [signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin
fi

install -d -m 0700 /etc/conexus "$secrets"
umask 0277
cat > "$secrets/tunnel_token"
chown "$cloudflared_uid" "$secrets/tunnel_token"
chmod 0400 "$secrets/tunnel_token"
umask 0022

id runner >/dev/null 2>&1 || useradd --create-home --shell /usr/sbin/nologin runner
usermod -aG docker runner

home=/home/runner/actions-runner
install -d -o runner -g runner "$home"
cd "$home"
if [ ! -x ./run.sh ]; then
  curl -fsSL -o runner.tar.gz \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
  echo "${RUNNER_SHA256}  runner.tar.gz" | sha256sum --check -
  sudo -u runner tar xzf runner.tar.gz
  rm runner.tar.gz
fi
if [ ! -f .runner ]; then
  sudo -u runner ./config.sh --unattended --url "$RUNNER_URL" --token "$RUNNER_TOKEN" \
    --labels hub --name hub --replace
fi
./svc.sh install runner
./svc.sh start
echo "server ready"
