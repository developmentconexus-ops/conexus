#!/usr/bin/env bash
# Laboratório: as linhas HUB_AWS_* que faltam no /etc/conexus/hub.env, sem as quais o Hub novo recusa
# subir (run 45092159064; infra/compose.yaml:36-37). Roda pelo lab.yml, como o usuário runner.
#
# 1. Num contêiner como uid 1000, o dono da chave, com só /etc/conexus/secrets/hub_aws_credentials e o
#    package-lock montados, só leitura: instala numa pasta de uso único o @aws-sdk/client-sts (na versão
#    do client-cloudformation do package-lock, que não tem o STS) e lê a conta por GetCallerIdentity.
# 2. Num contêiner de uso único como root, com /etc/conexus montado: node lab/hub-env-aws.mjs acrescenta
#    HUB_AWS_ACCOUNT, HUB_AWS_HUB_ROLE_ARN, HUB_AWS_SERVICE_ROLE_ARN e HUB_AWS_TEMPLATE_BUCKET, de forma
#    idempotente, mantendo o dono e o modo 0400.
# 3. HUB_AWS_REGION é exigida (apps/server/src/platform/config-aws.ts), mas o compose.yaml a passa em
#    environment, que vence o env_file: só entra no hub.env se o compose.yaml deixar de passá-la.
# 4. Imprime só os nomes das variáveis, o dono e o modo. Todo número de 12 dígitos vira <conta>.
# Não toca em mais nada do servidor: nem o Hub, nem o deploy.
set -euo pipefail

aqui="$(cd "$(dirname "$0")" && pwd)"
raiz="$(dirname "$aqui")"
chave=/etc/conexus/secrets/hub_aws_credentials
hub_env=/etc/conexus/hub.env

para() {
  echo "PARADO: $1" >&2
  exit 1
}
esconde() { sed -E 's/[0-9]{12}/<conta>/g'; }

{ : < "$hub_env"; } 2> /dev/null || para "$hub_env não existe ou o $(id -un) não lê"
echo "hub.env antes: $(stat -c '%U:%G %a' "$hub_env")"
[ "$(stat -c '%U %a' "$hub_env")" = "$(id -un) 400" ] || para "o hub.env não é do $(id -un) com modo 0400"

imagem="$(timeout 60 docker ps --filter label=com.docker.compose.project=conexus \
  --filter label=com.docker.compose.service=hub --format '{{.Image}}')" || para "o Docker não respondeu"
imagem="${imagem%%$'\n'*}"
if [ -z "$imagem" ] && docker image inspect node:24-slim > /dev/null 2>&1; then
  imagem=node:24-slim
fi
[ -n "$imagem" ] || para "nenhuma imagem com node já baixada"
echo "imagem do contêiner: $imagem"

trabalho="$(mktemp -d "${RUNNER_TEMP:-/tmp}/hub-env-aws.XXXXXX")"
trap 'rm -rf "$trabalho"' EXIT
chmod 0777 "$trabalho"

echo "== 1. a conta da chave do Hub"
conta="$(timeout --kill-after=30 300 docker run --rm --pull never --user 1000:1000 \
  --mount "type=bind,source=$chave,target=/run/secrets/hub_aws_credentials,readonly" \
  --mount "type=bind,source=$raiz/package-lock.json,target=/lock/package-lock.json,readonly" \
  --mount "type=bind,source=$trabalho,target=/deps" \
  -e HOME=/deps/home -e AWS_SHARED_CREDENTIALS_FILE=/run/secrets/hub_aws_credentials \
  -e AWS_CONFIG_FILE=/deps/sem-config -e AWS_REGION=us-east-2 \
  --entrypoint /bin/sh "$imagem" -euc '
    cd /deps && echo "{\"private\":true}" > package.json
    versao="$(node -e "const v=require(\"/lock/package-lock.json\").packages[\"node_modules/@aws-sdk/client-cloudformation\"]?.version; if(!/^\d+\.\d+\.\d+$/.test(v??\"\")) process.exit(1); console.log(v)")"
    echo "@aws-sdk/client-sts@$versao" >&2
    npm install --no-save --no-audit --no-fund --loglevel=error "@aws-sdk/client-sts@$versao" > /dev/null
    node -e "
      const { STSClient, GetCallerIdentityCommand } = require(\"@aws-sdk/client-sts\")
      new STSClient({}).send(new GetCallerIdentityCommand({})).then(
        (r) => console.log(r.Account),
        (e) => { console.error(\"GetCallerIdentity falhou: \" + e.name); process.exit(1) })
    "
  ' 2> >(esconde >&2))" || para "não li a conta"
[[ $conta =~ ^[0-9]{12}$ ]] || para "GetCallerIdentity não deu uma conta de 12 dígitos"
echo "conta lida: <conta>"

echo "== 3. HUB_AWS_REGION"
if grep -qE '^ +HUB_AWS_REGION: us-east-2$' "$raiz/infra/compose.yaml"; then
  regiao=0
  echo "o compose.yaml já a passa em environment; fica fora do hub.env"
else
  regiao=1
  echo "o compose.yaml não a passa; entra no hub.env se faltar"
fi

echo "== 2. o hub.env, como root"
CONTA="$conta" timeout --kill-after=30 120 docker run --rm --pull never --user 0:0 \
  --mount "type=bind,source=/etc/conexus,target=/etc/conexus" \
  --mount "type=bind,source=$aqui/hub-env-aws.mjs,target=/lab/hub-env-aws.mjs,readonly" \
  -e CONTA --network none \
  --entrypoint node "$imagem" /lab/hub-env-aws.mjs "$hub_env" "$regiao" 2>&1 | esconde

echo "== 4. o hub.env depois"
echo "dono e modo: $(stat -c '%U:%G %a' "$hub_env")"
[ "$(stat -c '%U %a' "$hub_env")" = "$(id -un) 400" ] || para "o hub.env não ficou do $(id -un) com modo 0400"
echo "variáveis:"
cut -d= -f1 "$hub_env" | grep -E '^[A-Z_][A-Z0-9_]*$' | sed 's/^/  /'
for nome in HUB_AWS_ACCOUNT HUB_AWS_HUB_ROLE_ARN HUB_AWS_SERVICE_ROLE_ARN HUB_AWS_TEMPLATE_BUCKET; do
  grep -q "^$nome=" "$hub_env" || para "falta $nome"
done
echo "hub.env pronto"
