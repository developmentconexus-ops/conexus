#!/usr/bin/env bash
# Laboratório: a prova do critério 35 do Lago 1 pelo diário da pilha (opção d do fundador, 2026-11-22),
# do servidor, com a chave do Hub (lab/chave-hub.sh do ramo lab/chave-hub), só na conta de laboratório,
# us-east-2. Roda pelo lab.yml, como o usuário runner. Molde: lab/p3-u4.sh do ramo lab/chave-hub.
#
# Num contêiner de uso único da imagem do Hub em execução (ou node:24-slim já baixada), como uid 1000, o
# dono da chave, com só /etc/conexus/secrets/hub_aws_credentials montado, só leitura:
# 1. instala numa pasta de uso único os clientes do SDK nas versões do package-lock deste ramo (o main);
# 2. node lab/gravar-diario.mjs: as criações que falham (CENARIOS, padrão C) pela receita publicada, o DescribeStackEvents de
#    cada pilha apagada, pelo id, e o GetTableBucket que diz se o depósito existe, em lab/out/gravacoes/;
# 3. node lab/conferir.mjs: apaga a gravação que tiver a conta, a chave ou um id de chave de verdade;
# 4. imprime cada gravação limpa em base64, entre marcadores, porque o artefato pode não chegar a quem lê.
# A chave não sai do contêiner, e todo número de 12 dígitos da saída do contêiner vira <conta>.
set -euo pipefail

aqui="$(cd "$(dirname "$0")" && pwd)"
raiz="$(dirname "$aqui")"
chave="${P3_CHAVE:-/etc/conexus/secrets/hub_aws_credentials}"
saida="$aqui/out/gravacoes"

para() {
  echo "PARADO: $1" >&2
  exit 1
}

imagem="$(timeout 60 docker ps --filter label=com.docker.compose.project=conexus \
  --filter label=com.docker.compose.service=hub --format '{{.Image}}')" || para "o Docker não respondeu"
imagem="${imagem%%$'\n'*}"
if [ -z "$imagem" ] && docker image inspect node:24-slim > /dev/null 2>&1; then
  imagem=node:24-slim
fi
[ -n "$imagem" ] || para "nenhuma imagem com node já baixada"
echo "imagem do contêiner: $imagem"

trabalho="$(mktemp -d "${RUNNER_TEMP:-/tmp}/diario.XXXXXX")"
trap 'rm -rf "$trabalho"' EXIT
mkdir -p "$saida"
chmod 0777 "$trabalho" "$saida"

esconde() { sed -E 's/[0-9]{12}/<conta>/g'; }

status=0
timeout --kill-after=30 2400 docker run --rm --pull never --user 1000:1000 \
  --mount "type=bind,source=$chave,target=/run/secrets/hub_aws_credentials,readonly" \
  --mount "type=bind,source=$raiz,target=/repo,readonly" \
  --mount "type=bind,source=$trabalho,target=/deps" \
  --mount "type=bind,source=$saida,target=/out" \
  -e HOME=/deps/home -e AWS_SHARED_CREDENTIALS_FILE=/run/secrets/hub_aws_credentials \
  -e AWS_CONFIG_FILE=/deps/sem-config -e AWS_REGION=us-east-2 -e CENARIOS="${CENARIOS:-C}" \
  -e LAB_RUN="${GITHUB_RUN_ID:?o lab.yml dá o GITHUB_RUN_ID}" \
  --entrypoint /bin/sh "$imagem" -euc '
    echo "== 0. o arquivo da chave: $(stat -c "%u:%g %a %s" /run/secrets/hub_aws_credentials)"
    cd /deps && echo "{\"private\":true}" > package.json
    pacotes="$(node /repo/lab/pacotes.mjs /repo/package-lock.json)"
    echo "pacotes: $pacotes"
    npm install --no-save --no-audit --no-fund --loglevel=error $pacotes > /dev/null
    echo "== o diário"
    d=0; node /repo/lab/gravar-diario.mjs /deps /repo us-east-2 /out || d=$?
    echo "== a conferência"
    c=0; node /repo/lab/conferir.mjs /deps /out || c=$?
    echo "== fim: o diário saiu $d, conferência saiu $c"
    [ "$d" -eq 0 ] && [ "$c" -eq 0 ]
  ' 2>&1 | esconde || status=$?

# A segunda conferência, de fora: um id de chave que não seja o inventado apaga a gravação.
for f in "$saida"/*.json; do
  [ -e "$f" ] || continue
  if grep -owE '(AKIA|ASIA)[A-Z0-9]{16}' "$f" | grep -qvx 'ASIAINVENTED000000001'; then
    echo "ERRO: $(basename "$f") tem um id de chave de verdade; apagado" >&2
    rm -f "$f"
    status=1
  fi
done
[ "$status" -eq 0 ] || para "o diário ou a conferência não saíram como esperado (saída $status)"
echo "== as gravações"
( cd "$saida" && sha256sum -- *.json )
for f in "$saida"/*.json; do
  echo "--- início $(basename "$f")"
  base64 -w 76 "$f"
  echo "--- fim $(basename "$f")"
done
echo "diário pronto"
