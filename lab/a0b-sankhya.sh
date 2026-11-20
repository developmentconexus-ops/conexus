#!/usr/bin/env bash
# A0b (versão final): leitura cronometrada de uma tabela fiscal grande no Sankhya, só leitura, o
# catálogo do Oracle das sete tabelas da A0, o dicionário do Sankhya (TDDTAB e TDDCAM, só contagens)
# e a medida do token do gateway em uso (passos A1 a C1 da seção 2.3 do estudo de causa raiz).
# Rodado pelo workflow lab (.github/workflows/lab.yml) no executor hub da VPS:
#   ramo = o ramo do laboratório que traz lab/a0b-sankhya.sh e lab/a0b-sankhya.ts
#   script = a0b-sankhya.sh, minutos = 40 (a execução inteira tem teto de 38 minutos; o timeout abaixo é 39)
#
# O que faz, e só isto (o mesmo caminho da V17, lab/v17-sankhya.sh):
#  1. recusa fora da janela aprovada: dia útil a partir das 17h30 até as 6h de Brasília, o fim de
#     semana inteiro e os feriados listados abaixo; num dia útil não começa depois das 5h20, para que
#     os 30 minutos da sonda terminem antes das 6h;
#  2. lê no Docker a imagem do Hub que está no ar (docker ps e docker inspect: só leitura; o
#     contêiner do Hub não é parado, reiniciado, nem recebe exec);
#  3. sobe UM contêiner avulso dessa imagem, que some no fim (--rm), sem privilégio, com só dois
#     segredos montados para leitura: a URL do banco do Hub e as chaves de selo;
#  4. nesse contêiner, lab/a0b-sankhya.ts abre a credencial de UMA conexão Sankhya e roda, nesta
#     ordem: a leitura cronometrada (até 25 min), o dicionário (até 2 min), o token em uso (até
#     uns 12 min, só se couber no teto de 38 min) e o logout de toda sessão aberta. Um sinal de
#     carga na primeira parte (página acima de 30 s, 429, 504) pula as duas seguintes.
#
# A saída vai para o log do workflow, que é público: a sonda imprime só códigos, contagens e tempos.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
secrets="${A0B_SECRETS_DIR:-/etc/conexus/secrets}"
image_pattern='^ghcr\.io/developmentconexus-ops/conexus-hub@sha256:[0-9a-f]{64}$'
# Feriados em que o dia inteiro está na janela (palavra do fundador: 2026-11-20 é feriado).
feriados=' 2026-11-20 2026-12-25 2027-01-01 '

say() { printf '{"a0b":"%s","motivo":"%s"}\n' "$1" "$2"; }

hhmm="$(TZ=America/Sao_Paulo date +%H%M)"
weekday="$(TZ=America/Sao_Paulo date +%u)"
today="$(TZ=America/Sao_Paulo date +%F)"
dentro=0
if [ "$weekday" -ge 6 ] || [[ $feriados == *" $today "* ]] || [ "$((10#$hhmm))" -ge 1730 ] || [ "$((10#$hhmm))" -lt 520 ]; then
  dentro=1
fi
if [ "${A0B_IGNORAR_JANELA:-}" != "prova-local" ] && [ "$dentro" -ne 1 ]; then
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
if [ "${A0B_SO_TEMPO:-}" = "1" ]; then
  prefix+=(--env A0B_SO_TEMPO=1)
fi
if [ -n "${A0B_CONEXAO_SHA256:-}" ]; then
  prefix+=(--env "A0B_CONEXAO_SHA256=$A0B_CONEXAO_SHA256")
fi

printf '{"a0b":"inicio","quando":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
status=0
# Tetos da sonda (PLANO): 25 minutos de leitura cronometrada, 2 de dicionário, e o token em uso
# (até 12 min 20 s no pior caso) só se couber nos 38 minutos da execução inteira; mais uma leitura de
# até 2 minutos em curso e os logouts. O timeout de 39 minutos fica abaixo dos 40 do workflow.
# --init põe um init como PID 1, que repassa o SIGTERM do timeout ao node; a sonda o recebe, não lê
# mais nada, para as esperas do token e faz os logouts.
timeout --kill-after=10 2340 docker run --rm --init --pull never --name "conexus-a0b-$$" \
  --user 1000 --read-only --tmpfs /tmp:size=16m \
  --cap-drop ALL --security-opt no-new-privileges --memory 512m --pids-limit 128 \
  --mount "type=bind,source=$secrets/hub_database_url,target=/run/secrets/hub_database_url,readonly" \
  --mount "type=bind,source=$secrets/hub_seal_keys,target=/run/secrets/hub_seal_keys,readonly" \
  --mount "type=bind,source=$here/a0b-sankhya.ts,target=/app/lab/a0b-sankhya.ts,readonly" \
  --env HUB_DATABASE_URL_FILE=/run/secrets/hub_database_url \
  --env HUB_SEAL_KEYS_FILE=/run/secrets/hub_seal_keys \
  "${prefix[@]}" \
  --entrypoint node "$image" /app/lab/a0b-sankhya.ts || status=$?
printf '{"a0b":"fim","codigo":%d}\n' "$status"
exit "$status"
