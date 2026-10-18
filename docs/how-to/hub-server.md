# Set up the Hub server

How the server is prepared, and how the Hub is published and put back. Decision: [0035](../decisions/0035-publish-through-a-runner-on-the-server.md).

## Prepare the server

1. Reinstall the server with Ubuntu LTS. Close every inbound port in the provider's firewall.
2. In the repository's GitHub settings, open Actions, then Runners, and add a self-hosted runner. Copy
   its registration token and the runner version with its checksum.
3. As root on the server, save the Cloudflare tunnel token and the runner registration token each in
   a file only root can read (mode 0400 or 0600), then run
   `RUNNER_URL=… RUNNER_VERSION=… RUNNER_SHA256=… TUNNEL_TOKEN_FILE=… RUNNER_TOKEN_FILE=… infra/setup-server.sh`
   and delete both files. It refuses a file others can read. It installs Docker, copies the
   tunnel token to `/etc/conexus/secrets/tunnel_token` (0400, folder 0700) and starts the runner as a
   service of `runner`, a user with no login, in the `docker` group. Then set
   [the runner's mirror](apps-edge.md#the-runners-mirror).
4. Make SSH key-only, then run `sshd -T` and read `passwordauthentication no`: the provider's main
   SSH configuration may lack the `Include` that reads a drop-in.
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
the founder's e-mail. Read its free terms for commercial use at sign-up; they were not checked.

## Database keys

Firstmate writes two files as root in `/etc/conexus/secrets`, then sets owner uid 1000 and mode 0400:
`hub_database_url`, the Hub login, and `hub_migration_database_url`, the owner login. Both hold a
direct (not pooled) PostgreSQL address. Only `migrate` mounts the owner key, and the `hub` container
mounts `hub_database_url` alone. Port 22 is open only while they are written.

## Session secret and first person

Firstmate writes `hub_session_secret` beside those keys, 32 random characters or more
(`openssl rand -base64 48`). `deploy.sh` refuses to run without it. A new secret, then Reiniciar o
Hub, ends every session.

## Para o fundador

- Enquanto o Firstmate grava um segredo no servidor, abra a porta 22 no firewall do provedor e
  feche-a depois. O e-mail dos convites: [hub-mail](hub-mail.md).
- Em Actions, rode "Criar a primeira pessoa". O resumo da execução, nunca o log, mostra um link
  `/set-password` de uso único, que vale 1 hora. Rodar de novo dá um link novo enquanto não
  houver senha.

## Publish

Merging into `main` publishes nothing. Create a GitHub Release whose tag is `v<n>.<n>.<n>` on a commit of
`main`. The workflow Publish builds the image, keeps the last ten, and runs `infra/deploy.sh` on the
server. A tag on another commit ends red and the Hub does not change. Counting the ten kept images
needs a token that can read packages.

Before it starts the new image, `deploy.sh` runs `migrate` for 60 seconds, but only when the image
carries the label `conexus.migrate=1`. A failed `migrate` leaves the live Hub as it is and ends the
run red. Rerun the failed job once the cause is fixed.

## Restart

Actions, Reiniciar o Hub, Run workflow. It runs `migrate` with the live image and starts the Hub
again, so "Último início" changes. Use it after every database restore:
[hub-database-restore](hub-database-restore.md). If the restarted Hub does not turn healthy, the run
ends red and says so; run Voltar atrás with an earlier version.

Every publish, restart and Voltar atrás recreates the `hub` container, so the Hub answers 502 from
Cloudflare for about 1 to 2 s, until step 16 removes the cut. A check that polls through it expects
those 502s and no 500.

## Put back

Actions, Voltar atrás, Run workflow, with a version whose digest main's Publish recorded on the
server. No record ends red. Running it again changes nothing. An image from before step 2 has no label, so
putting it back skips `migrate`.

## When it fails

- A release whose program does not start: `deploy.sh` brings the earlier image back and the run ends red.
- Read the state with `docker compose --file infra/compose.yaml ps` and `docker logs`. Logs carry no secret.
