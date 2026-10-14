# Set up the Hub server

How the São Paulo server is prepared, and how the Hub is published and put back. Decision: [0035](../decisions/0035-publish-through-a-runner-on-the-server.md).

## Prepare the server

1. Reinstall the server with Ubuntu LTS. Close every inbound port in the provider's firewall.
2. In the repository's GitHub settings, open Actions, then Runners, and add a self-hosted runner. Copy
   its registration token and the runner version with its checksum.
3. As root on the server, save the Cloudflare tunnel token and the runner registration token each in
   a file only root can read (mode 0400 or 0600), then run
   `RUNNER_URL=… RUNNER_VERSION=… RUNNER_SHA256=… TUNNEL_TOKEN_FILE=… RUNNER_TOKEN_FILE=… infra/setup-server.sh`
   and delete both files. The script runs once: a second run stops at the runner service, which
   already exists. It refuses a file others can read. It installs Docker, copies the
   tunnel token to `/etc/conexus/secrets/tunnel_token` (0400, folder 0700) and starts the runner as a
   service of the user `runner`, which has no login and sits in the `docker` group.
4. Make SSH key-only, then run `sshd -T` and read `passwordauthentication no`: the provider's
   `sshd_config` may have no `Include`, and then a drop-in under `/etc/ssh/sshd_config.d` is ignored.
5. Close SSH last, after the provider's console is proved to work. Without a console, stop and ask.

## Check the GitHub settings

- Actions, General, fork pull request workflows: require approval for all outside collaborators, and
  never run workflows from forks on the self-hosted runner. Only `release` and `workflow_dispatch`
  reach it.
- Actions, General, workflow permissions: read only by default.
- Packages: the `conexus-hub` image is private.

## Cloudflare

Done by firstmate with the founder's key, deleted afterwards: a tunnel, the Hub's public name pointing
to `http://hub:8080`, its DNS record, the token on the server, a Tunnel Health Alert to the
founder's e-mail, and a configuration rule (phase `http_config_settings`) with `disable_rum` for the
Hub's host. Without that rule the edge injects the Web Analytics beacon into the page, and the Hub's
CSP refuses it. Setting the rule needs a key with Zone Config Rules Edit.

## External monitor

StatusCake, free plan: an HTTP check of `https://<the Hub's name>/api/health` every 5 minutes, alerting
the founder's e-mail. Its free terms for commercial use were not checked when this was written: read
them at sign-up.

## Publish

Merging into `main` publishes nothing. Create a GitHub Release whose tag is `v<n>.<n>.<n>` on a commit of
`main`. The workflow Publish builds the image, keeps the last ten, and runs `infra/deploy.sh` on the
server. A tag on another commit ends red and the Hub does not change. Counting the ten kept images
needs a token that can read packages.

## Put back

Actions, Voltar atrás, Run workflow, with one of the last ten versions. An unknown version ends red.
Running it twice with the same version changes nothing.

## When it fails

- A release whose program does not start: `deploy.sh` brings the earlier image back and the run ends red.
- Read the state with `docker compose --file infra/compose.yaml ps` and `docker logs`. Logs carry no secret.
