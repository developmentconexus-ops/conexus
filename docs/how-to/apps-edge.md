# Set up the apps' edge

What firstmate does once with the founder's approval, then how the edge is published and put back. Decisions: [0041](../decisions/0041-app-session-check-through-workers-vpc.md), [0042](../decisions/0042-cloudflare-token-in-one-call-environment.md). The Hub's server comes first: [hub-server](hub-server.md).

## Create once

Run `wrangler` from `apps/edge` with the installed version, using a token of your own that can create these; delete that token afterwards.

1. The namespace: `wrangler dispatch-namespace create conexus-apps`. It needs Workers for Platforms on the account.
2. The VPC service, over the server's existing tunnel (cloudflared reaches Cloudflare on QUIC, UDP 7844, so no inbound port opens):
   `wrangler vpc service create conexus-hub-borda --type http --tunnel-id <tunnel id> --hostname hub --http-port 8081`.
   Copy the id it prints into `vpc_services` in `apps/edge/wrangler.jsonc`, and commit that. The
   Hub listens on 8081 only when `HUB_EDGE_PORT` is set; `infra/compose.yaml` sets it and never lists
   it under `ports:`, so the port stays on the Compose network.
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

## The runner's gate

`infra/setup-runner-hook.sh`, which `infra/setup-server.sh` runs, installs
`infra/runner-job-started.sh` as root's file and names it in the runner's `.env` as
`ACTIONS_RUNNER_HOOK_JOB_STARTED`. Before any step of any job on this runner, the
hook accepts only a Release or a manual run of `main` whose commit is on `main`, read from the mirror
of `main` in `/var/lib/conexus/main.git` that it fetches first. A push, another branch, a pull
request, a commit outside `main`, a missing mirror or a failed fetch fails the job before a step can
reach the token or the Hub's keys. Voltar atrás checks the version's own commit the same way before
its `npm ci`.
A server prepared before this hook gets it from firstmate, as root from a checkout of `main`:
`infra/setup-runner-hook.sh`, with the mirror's two variables. It installs `git` and restarts the
runner's service.

The mirror, once, as root: `ssh-keygen -t ed25519 -N '' -f <file>`; add `<file>.pub` in the
repository's GitHub settings as a deploy key without write access; run
`MIRROR_URL=git@github.com:<owner>/<repo>.git DEPLOY_KEY_FILE=<file> infra/setup-runner-hook.sh`;
delete both files. Until then the hook refuses every job.

## Publish

A Release publishes the Hub, then the edge from the Release's own commit: the wall
(`conexus-outbound`), the example into the namespace (`conexus-example`, `--dispatch-namespace
conexus-apps`), then the dispatcher (`conexus-dispatcher`). Two publishes never overlap (the
`hub-server` concurrency group). A failed step fails the Release: the Hub stays new, the Workers
already published stay, and the others keep their earlier code. Rerun the failed job once the cause
is fixed; publishing the same code again changes nothing. The log has `wrangler`'s own output and
never the token.

## Put back

Actions, Voltar atrás, with one of the last ten versions. The edge goes first, by publishing that
version's code with the same script, then the Hub. `wrangler rollback` is not used: a Worker in a
namespace has no versions. A version from before step 8 has no `apps/edge`: the run says so, leaves
the edge as it is, and puts the Hub back; Criar Projeto works on that Hub.

## Para o fundador

- Antes da primeira publicação da borda: abra a porta 22 enquanto o Firstmate grava o arquivo do
  token, e feche-a depois. O token é só de publicar; crie-o no painel, com as três permissões
  acima, e entregue o valor ao Firstmate sem colar no chat.
