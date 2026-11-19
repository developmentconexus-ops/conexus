#!/usr/bin/env bash
# V17: duas sessões do mesmo usuário de integração no Sankhya ao mesmo tempo, só leitura.
# Rodado pelo workflow lab (.github/workflows/lab.yml) no executor hub da VPS:
#   ramo = o ramo do laboratório que traz lab/v17-sankhya.sh e lab/v17-sankhya.ts
#   script = v17-sankhya.sh, minutos = 5
#
# O que faz, e só isto:
#  1. lê no Docker a imagem do Hub que está no ar (docker ps e docker inspect: só leitura; o
#     contêiner do Hub não é parado, reiniciado, nem recebe exec);
#  2. recusa fora da janela aprovada (fora do horário comercial de Brasília);
#  3. sobe UM contêiner avulso dessa imagem, que some no fim (--rm), sem privilégio, com só dois
#     segredos montados para leitura: a URL do banco do Hub e as chaves de selo. É o mesmo jeito que
#     o deploy usa para conferir segredos (infra/deploy.sh:100-116), e o mesmo usuário 1000 do Hub;
#  4. nesse contêiner, lab/v17-sankhya.ts abre a credencial de UMA conexão Sankhya e roda o protocolo.
#
# A saída vai para o log do workflow, que é público: a sonda imprime só códigos e tempos.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
secrets="${V17_SECRETS_DIR:-/etc/conexus/secrets}"
image_pattern='^ghcr\.io/developmentconexus-ops/conexus-hub@sha256:[0-9a-f]{64}$'

say() { printf '{"v17":"%s","motivo":"%s"}\n' "$1" "$2"; }

# A janela: dias úteis das 20h às 6h, e o fim de semana inteiro, no horário de Brasília.
hour="$(TZ=America/Sao_Paulo date +%-H)"
weekday="$(TZ=America/Sao_Paulo date +%u)"
if [ "${V17_IGNORAR_JANELA:-}" != "prova-local" ] && [ "$weekday" -le 5 ] && [ "$hour" -ge 6 ] && [ "$hour" -lt 20 ]; then
  say recusa fora-da-janela
  exit 2
fi

hub="$(docker ps --quiet --filter label=com.docker.compose.project=conexus --filter label=com.docker.compose.service=hub)"
if [ -z "$hub" ] || [ "$(printf '%s\n' "$hub" | wc -l)" -ne 1 ]; then
  say recusa hub-nao-unico
  exit 2
fi
image="$(docker inspect --format '{{.Config.Image}}' "$hub")"
if ! [[ $image =~ $image_pattern ]]; then
  say recusa imagem-sem-digest
  exit 2
fi

prefix=()
if [ -n "${V17_CONEXAO_SHA256:-}" ]; then
  prefix=(--env "V17_CONEXAO_SHA256=$V17_CONEXAO_SHA256")
fi

printf '{"v17":"inicio","quando":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
status=0
timeout --kill-after=10 180 docker run --rm --pull never --name "conexus-v17-$$" \
  --user 1000 --read-only --tmpfs /tmp:size=16m \
  --cap-drop ALL --security-opt no-new-privileges --memory 512m --pids-limit 128 \
  --mount "type=bind,source=$secrets/hub_database_url,target=/run/secrets/hub_database_url,readonly" \
  --mount "type=bind,source=$secrets/hub_seal_keys,target=/run/secrets/hub_seal_keys,readonly" \
  --mount "type=bind,source=$here/v17-sankhya.ts,target=/app/lab/v17-sankhya.ts,readonly" \
  --env HUB_DATABASE_URL_FILE=/run/secrets/hub_database_url \
  --env HUB_SEAL_KEYS_FILE=/run/secrets/hub_seal_keys \
  "${prefix[@]}" \
  --entrypoint node "$image" /app/lab/v17-sankhya.ts || status=$?
printf '{"v17":"fim","codigo":%d}\n' "$status"
exit "$status"
