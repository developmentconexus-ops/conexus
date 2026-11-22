#!/usr/bin/env bash
# Laboratório: o P3 do Lago 1 e a gravação da U4, do servidor, com a chave do Hub que lab/chave-hub.sh
# gravou (palavra do fundador, 2026-11-22). Roda pelo lab.yml, como o usuário runner.
#
# Num contêiner de uso único da imagem do Hub em execução (ou node:24-slim já baixada), como uid 1000, o
# dono da chave, com só /etc/conexus/secrets/hub_aws_credentials montado, só leitura:
# 1. instala numa pasta de uso único os clientes do SDK nas versões do package-lock do main (mais o do IAM,
#    só para a recusa c7);
# 2. node lab/p3.mjs: a criação aceita, as sete recusas da B.4 e as cinco do critério 4, e a saída;
# 3. node lab/gravar-u4.mjs: as respostas cruas da U4, com a conta, os ids e as credenciais trocados, em
#    lab/out/gravacoes/, que o lab.yml devolve como artefato.
# 4. node lab/conferir.mjs: apaga a gravação que tiver a conta, a chave ou um id de chave de verdade;
# 5. imprime cada gravação limpa em base64, entre marcadores, porque o artefato pode não chegar a quem lê.
# O órfão da gravação já foi plantado pelo administrador; o nome dele está em lab/orfao.txt.
# A chave não sai do contêiner, e todo número de 12 dígitos da saída do contêiner vira <conta>.
# Com SO_U4=1 (lab/u4.sh), pula o P3.
set -euo pipefail

aqui="$(cd "$(dirname "$0")" && pwd)"
raiz="$(dirname "$aqui")"
chave="${P3_CHAVE:-/etc/conexus/secrets/hub_aws_credentials}"
saida="$aqui/out/gravacoes"
so_u4="${SO_U4:-0}"

para() {
  echo "PARADO: $1" >&2
  exit 1
}

orfao="$(tr -d '[:space:]' < "$aqui/orfao.txt")"
[[ $orfao =~ ^conexus-[a-z0-9]{12}$ ]] || para "lab/orfao.txt não tem um conexus-<12>"
echo "órfão: $orfao"

imagem="$(timeout 60 docker ps --filter label=com.docker.compose.project=conexus \
  --filter label=com.docker.compose.service=hub --format '{{.Image}}')" || para "o Docker não respondeu"
imagem="${imagem%%$'\n'*}"
if [ -z "$imagem" ] && docker image inspect node:24-slim > /dev/null 2>&1; then
  imagem=node:24-slim
fi
[ -n "$imagem" ] || para "nenhuma imagem com node já baixada"
echo "imagem do contêiner: $imagem"

trabalho="$(mktemp -d "${RUNNER_TEMP:-/tmp}/p3-u4.XXXXXX")"
trap 'rm -rf "$trabalho"' EXIT
mkdir -p "$saida"
chmod 0777 "$trabalho" "$saida"

esconde() { sed -E 's/[0-9]{12}/<conta>/g'; }

status=0
timeout --kill-after=30 1500 docker run --rm --pull never --user 1000:1000 \
  --mount "type=bind,source=$chave,target=/run/secrets/hub_aws_credentials,readonly" \
  --mount "type=bind,source=$raiz,target=/repo,readonly" \
  --mount "type=bind,source=$trabalho,target=/deps" \
  --mount "type=bind,source=$saida,target=/out" \
  -e HOME=/deps/home -e AWS_SHARED_CREDENTIALS_FILE=/run/secrets/hub_aws_credentials \
  -e AWS_CONFIG_FILE=/deps/sem-config -e AWS_REGION=us-east-2 -e ORFAO="$orfao" -e SO_U4="$so_u4" \
  --entrypoint /bin/sh "$imagem" -euc '
    echo "== 0. o arquivo da chave: $(stat -c "%u:%g %a %s" /run/secrets/hub_aws_credentials)"
    cd /deps && echo "{\"private\":true}" > package.json
    pacotes="$(node /repo/lab/pacotes.mjs /repo/package-lock.json)"
    echo "pacotes: $pacotes"
    npm install --no-save --no-audit --no-fund --loglevel=error $pacotes > /dev/null
    p3=0
    if [ "$SO_U4" = 1 ]; then echo "== P3 pulado (SO_U4)"; else echo "== P3"; node /repo/lab/p3.mjs /deps /repo || p3=$?; fi
    echo "== U4"
    u4=0; node /repo/lab/gravar-u4.mjs /deps /repo us-east-2 /out || u4=$?
    echo "== a conferência"
    c=0; node /repo/lab/conferir.mjs /deps /out || c=$?
    echo "== fim: P3 saiu $p3, U4 saiu $u4, conferência saiu $c"
    [ "$p3" -eq 0 ] && [ "$u4" -eq 0 ] && [ "$c" -eq 0 ]
  ' 2>&1 | esconde || status=$?

# A segunda conferência, de fora: um id de chave que não seja o inventado apaga a gravação. A conta de
# verdade é conferida dentro do contêiner (conferir.mjs), pelo valor, porque os ids inventados também
# têm 12 dígitos seguidos.
for f in "$saida"/*.json; do
  [ -e "$f" ] || continue
  if grep -owE '(AKIA|ASIA)[A-Z0-9]{16}' "$f" | grep -qvx 'ASIAINVENTED000000001'; then
    echo "ERRO: $(basename "$f") tem um id de chave de verdade; apagado" >&2
    rm -f "$f"
    status=1
  fi
done
[ "$status" -eq 0 ] || para "o P3, a gravação ou a conferência não saíram como esperado (saída $status)"
echo "== as gravações"
( cd "$saida" && sha256sum -- *.json )
for f in "$saida"/*.json; do
  echo "--- início $(basename "$f")"
  base64 -w 76 "$f"
  echo "--- fim $(basename "$f")"
done
echo "P3 e U4 prontos"
