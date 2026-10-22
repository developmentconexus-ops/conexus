# Set up the Hub server

Decision: [0035](../decisions/0035-publish-through-a-runner-on-the-server.md).

## Prepare the server

1. Reinstall the server with Ubuntu LTS; close every inbound port in the provider's firewall.
2. In the repository's GitHub settings, open Actions, then Runners, and add a self-hosted runner. Copy
   its registration token and the runner version with its checksum.
3. As root on the server, save the Cloudflare tunnel token and the runner registration token each in
   a file only root can read (mode 0400 or 0600), then run
   `RUNNER_URL=… RUNNER_VERSION=… RUNNER_SHA256=… TUNNEL_TOKEN_FILE=… RUNNER_TOKEN_FILE=… infra/setup-server.sh`
   and delete both files. It installs Docker, copies the tunnel token to
   `/etc/conexus/secrets/tunnel_token` (0400, folder 0700) and starts the runner as a service of
   `runner`, a user with no login, in the `docker` group. Then set
   [the runner's mirror](apps-edge.md#the-runners-mirror).
4. Make SSH key-only; run `sshd -T` and read `passwordauthentication no`: the main SSH
   configuration may lack the `Include` that reads a drop-in.
5. Close SSH last, once the provider's console is proved; without one, ask.

## Check the GitHub settings

- Actions, General, fork pull request workflows: require approval for all external contributors.
- Environment `production`, made first: main's workflows run only from `main` and `v*` tags.
- Actions, General, workflow permissions: read only by default.
- Packages: keep the `conexus-hub` image private.

## Cloudflare

Firstmate does this with the founder's key, deleted afterwards: a tunnel, the Hub's public name pointing
to `http://hub:8080`, its DNS record, the token on the server, a Tunnel Health Alert to the
founder's e-mail, and a configuration rule (phase `http_config_settings`) with `disable_rum` for the
Hub's host. Without that rule the edge injects the Web Analytics beacon into the page, and the Hub's
CSP refuses it. Setting the rule needs a key with Zone Config Rules Edit.

## External monitor

StatusCake, free plan: an HTTP check of `https://<the Hub's name>/api/health` every 5 minutes, e-mailing
the founder. Read its free terms for commercial use at sign-up; they were not checked.

## Database keys

Firstmate writes three direct (not pooled) PostgreSQL addresses as root in `/etc/conexus/secrets`,
owner uid 1000, mode 0400: `hub_database_url`, the Hub login; `hub_mastra_database_url`,
`mastra_runtime` on Mastra's database beside the Hub's; `hub_migration_database_url`, the owner
login, which only `migrate` mounts. `migrate` creates Mastra's database.

## Git and build machines

The volume `hub_git` holds each app's Git. The founder makes a private R2 bucket and its key; firstmate
writes `hub_git_copy_key` (`<key id> <secret>`), `hub_e2b_api_key` and, in `hub.env`,
`HUB_GIT_COPY_BUCKET` and `HUB_INSTALLATION_ID` (`openssl rand -hex 12`), then builds the template
the template as [builder-template](builder-template.md)
says ([0051](../decisions/0051-builder-machine-git-and-copy-in-r2.md)). Every installation, a developer's
copy included, makes its own id and never copies production's `hub.env`: the id alone keeps their
machines apart.

## Session secret and first person

Firstmate writes `hub_session_secret` beside those keys, 32 random characters or more
(`openssl rand -base64 48`); `deploy.sh` refuses to run without it. A new one, then Reiniciar o Hub,
ends every session. The model accounts' seal keys: [seal-keys](seal-keys.md).

## Para o fundador

- Enquanto o Firstmate grava um segredo no servidor, abra a porta 22 no firewall do provedor e
  feche-a depois. Convites: [hub-mail](hub-mail.md).
- A primeira pessoa: como root no servidor, o Firstmate roda
  `infra/first-person.sh "<nome>" "<e-mail>"`. O link de uso único, válido por 1 hora, aparece só
  nesse terminal. Rodar de novo dá outro link enquanto não houver senha.

## Publish

Merging into `main` publishes nothing. Create a GitHub Release tagged `v<n>.<n>.<n>` on a commit of
`main`. The workflow Publish builds the image, keeps the last ten, and runs `infra/deploy.sh` on the
server. A tag on another commit ends red and the Hub does not change. Keeping ten images needs Admin
in the package's Actions access ([apps-edge](apps-edge.md)).

Before it starts the new image, `deploy.sh` runs `migrate` for 60 seconds, only when the image
carries the label `conexus.migrate=1`. A failed `migrate` leaves the live Hub as it is and ends the
run red; rerun it once fixed.

## Restart

Actions, Reiniciar o Hub, Run workflow. It runs `migrate` with the live image and starts the Hub
again ("Último início" changes). Use it after every database restore:
[hub-database-restore](hub-database-restore.md). If the Hub is not healthy after it, the run ends
red; run Voltar atrás with an earlier version.

Every publish, restart and Voltar atrás recreates the `hub` container: Cloudflare answers 502 for
about 1 to 2 s, until step 16. A check that polls through it expects those 502s and no 500.

## Put back

Actions, Voltar atrás, Run workflow, with a version whose digest main's Publish recorded on the
server; no record ends red. Running it again changes nothing. An image from before step 2 has no
label, so putting it back skips `migrate`.

## When it fails

- A release that does not start: `deploy.sh` restores the earlier image; the run ends red.
- State: `docker compose --file infra/compose.yaml ps`, `docker logs`. Logs carry no secret.
