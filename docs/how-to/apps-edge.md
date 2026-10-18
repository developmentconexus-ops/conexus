# Set up the apps' edge

What firstmate does once with the founder's approval, then how the edge is published and put back. Decisions: [0041](../decisions/0041-app-session-check-through-workers-vpc.md), [0042](../decisions/0042-cloudflare-token-in-one-call-environment.md). The Hub's server comes first: [hub-server](hub-server.md).

## Create once

Run `wrangler` from `apps/edge` with the installed version, using a token of your own that can create these; delete that token afterwards.

1. The namespace: `wrangler dispatch-namespace create conexus-apps`. It needs Workers for Platforms on the account.
2. The VPC service, over the server's existing tunnel (cloudflared reaches Cloudflare on QUIC, UDP 7844, so no inbound port opens):
   `wrangler vpc service create conexus-hub-borda --type http --tunnel-id <tunnel id> --hostname hub --http-port 8081`.
   Copy the id it prints into `vpc_services` in `apps/edge/wrangler.jsonc`, and commit that.
   `infra/compose.yaml` keeps 8081 off `ports:`.
3. The DNS record in the apps' zone: `*`, type `AAAA`, value `100::`, proxied. It only sends every
   host to Cloudflare, where the dispatcher's route `*.<apps domain>/*` answers.
4. Keep Web Analytics off for that zone. Its beacon breaks the apps' content security policy (0041).

The dispatcher's route and the Hub's `HUB_APPS_DOMAIN` name the same apps domain.

## The publish token

1. In the Cloudflare dashboard, create an account-owned API token with only:
   - Workers Scripts: Edit (account): the dispatcher, the wall and the example in the namespace;
   - Connectivity Directory: Bind (account): the dispatcher's binding to the VPC service;
   - Workers Routes: Edit (zone, the apps' zone only): the route `*.conexusapp.tech/*`.
2. On the server, as root, write `/etc/conexus/cloudflare.env` with two lines, `CLOUDFLARE_API_TOKEN=…`
   and `CLOUDFLARE_ACCOUNT_ID=…` (the account id stays out of Git), then `chown runner:runner` it and
   `chmod 0400` it. `/etc/conexus` is traversable by the runner; `secrets/` is not, so the file sits
   beside it. Port 22 is open only while you write it.
3. `infra/publish-edge.sh` refuses the file when it is missing, empty, readable by others, owned by
   another user or short of either key. It hands `wrangler` only the path, through `--env-file`.
4. Delete the token from the shell history and from every note. A leaked token is replaced in the
   dashboard and in this file.

## The apps' token and key

The Hub sends each version of an app as a Worker in the namespace, and the dispatcher opens the
app's logins in the company's database. Decision: [0043](../decisions/0043-app-logins-derived-from-one-key.md).

1. The Hub's token: in the dashboard, an account-owned API token with only Workers Scripts: Edit
   (account), apart from the publish token. As root on the server, write it to
   `/etc/conexus/secrets/hub_cloudflare_apps_token`, owner uid 1000, mode 0400, and add
   `HUB_CLOUDFLARE_ACCOUNT_ID=<account id>` to `/etc/conexus/hub.env`.
2. The key the apps' login passwords derive from, generated on the server and never typed:
   `openssl rand -hex 32 > /etc/conexus/secrets/hub_app_login_key`, owner uid 1000, mode 0400.
   The runner reads its own copy: `install -m 0400 -o runner -g runner
   /etc/conexus/secrets/hub_app_login_key /etc/conexus/app-login-key`.
3. A copy for the founder, kept off the server: `cat` the key once into a file on the founder's
   computer over the same session, and delete it from the scrollback. Without it, a lost server
   loses every app's logins.
4. `deploy.sh` refuses to start the Hub without either secret; the Hub refuses with `CONFIG_INVALID`
   naming the variable when a file is empty or readable by others. `publish-edge.sh` refuses the
   runner's copy the same way as the publish token's file, then hands it to `wrangler secret put
   APP_LOGIN_KEY` on its standard input, before the dispatcher's code.

**Rotation.** The token: create a new one, write it over the file, Reiniciar o Hub, then delete the
old one in the dashboard. The key does not rotate: each login's password was set from it when the
app's schema was made, so a new key locks every app out of its database (0043, not covered). A
leaked key returns to the founder.

## The runner's gate

`infra/setup-runner-hook.sh` names `infra/runner-job-started.sh` in the runner's `.env`. Before any
job's first step, the hook refuses all but a Release or a manual run of `main` whose commit is on `main`,
read from a mirror it fetches first (0035). Voltar atrás checks the version's commit too.

## The runner's mirror

As root on the server, from a checkout of `main`, while no job runs. No `hub` workflow until step 6
passes. Step 1 names the hook first: a failed mirror refuses every job.

1. `MIRROR_URL=https://github.com/developmentconexus-ops/conexus.git infra/setup-runner-hook.sh`
   prints `mirror of main ready`, then `runner hook ready`. The repository is public, so no key;
   if it turns private, the fetch fails and every job is refused.
2. `sudo -u runner git --git-dir=/var/lib/conexus/main.git rev-parse main` prints `main`'s head.
3. A tag ruleset on `refs/tags/v*` restricts creation, update and deletion, bypassed by the Write
   role, today only the founder's working account (an admin tags anyway); granting Write grants
   `v*` tags, so review it then.
4. The `conexus-hub` package's Actions access: this repository alone, role Admin (not Write),
   branches included; Voltar atrás deploys only recorded digests.
5. Each kept version's green run of `gh run list --workflow publish.yml --event release`, on a
   commit of `main`, logged `live: <reference>` (`gh run view <run> --log | grep 'live: '`). The
   live version's equals `docker ps --filter label=com.docker.compose.service=hub --format '{{.Image}}'`.
   `sudo -u runner git clone --quiet --branch main /var/lib/conexus/main.git /tmp/conexus-main`, then
   `sudo -u runner /tmp/conexus-main/infra/releases.sh record <version> <reference>`; its
   `find <version>` prints the reference. `rm -rf /tmp/conexus-main`.
6. Reiniciar o Hub runs on `main` and says `refused` on another branch, as does
   `sudo -u runner env GITHUB_EVENT_NAME=release GITHUB_SHA=0000000000000000000000000000000000000000 /etc/conexus/runner-job-started.sh`.

## Publish

A Release publishes the Hub, then the edge from the Release's own commit: the wall
(`conexus-outbound`), the example into the namespace (`conexus-example`, `--dispatch-namespace
conexus-apps`), the dispatcher's `APP_LOGIN_KEY`, then the dispatcher (`conexus-dispatcher`). The
Release also carries `recados-1.zip` and `recados-2.zip`, the two versions of Recados to send from a
Projeto's Configurações. Two publishes never overlap (the
`hub-server` concurrency group). A failed step fails the Release: the Hub stays new, the Workers
already published stay, and the others keep their earlier code. Rerun the failed job once the cause
is fixed; publishing the same code again changes nothing. The log never has the token.

## Put back

Actions, Voltar atrás, with a recorded version. The edge goes first, publishing that
version's code with the same script, then the Hub. A version from before step 8 has no
`apps/edge`: the run says so, leaves the edge as it is, and puts the Hub back.

## Para o fundador

- Antes da primeira publicação da borda: abra a porta 22 enquanto o Firstmate grava o arquivo do
  token, e feche-a depois. O token é só de publicar; crie-o no painel, com as três permissões
  acima, e entregue o valor ao Firstmate sem colar no chat.
- Antes do Release da etapa 9: crie no painel o token do Hub para os apps, só com Workers Scripts:
  Edit, e entregue-o do mesmo jeito. O Firstmate gera a chave dos logins dos apps no servidor e
  deixa uma cópia num arquivo no seu computador: guarde-a fora dele. Sem ela, perder o servidor é
  perder o acesso de cada app ao seu banco.
