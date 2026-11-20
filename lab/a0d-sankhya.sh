#!/usr/bin/env bash
# A0d: a leitura do kit por janela de mês e pelo incremental nas cinco tabelas fiscais do Sankhya, só leitura.
# A TGFEFDVMRSTDIA por janela de mês pela instrução que a `lerPagina` do kit monta (a subconsulta `Q`) contra a
# forma direta da A0c, com o plano (V$SQL_PLAN); a TGFCTE e a TCBSAL por janela de mês (contagem por mês, 5
# páginas, o plano, 1, 2 e 3 sessões); a TGFLIV e a TCBPLA pelo incremental da coluna de alteração (3 páginas).
# Rodado pelo workflow lab (.github/workflows/lab.yml) no executor hub da VPS:
#   ramo = o ramo do laboratório que traz lab/a0d-sankhya.sh e lab/a0d-sankhya.ts
#   script = a0d-sankhya.sh, minutos = 17 (a execução inteira tem teto de 15 minutos; o timeout abaixo é 15)
#
# O que faz, e só isto (o mesmo caminho da A0b, lab/a0b-sankhya.sh):
#  1. recusa fora da janela aprovada: dia útil a partir das 17h30 até as 6h de Brasília, o fim de
#     semana inteiro e os feriados listados abaixo; num dia útil não começa depois das 5h30, para que
#     os 15 minutos da sonda terminem antes das 6h (a A0b usava 5h20 para 30 minutos);
#  2. lê no Docker a imagem do Hub que está no ar (docker ps e docker inspect: só leitura; o
#     contêiner do Hub não é parado, reiniciado, nem recebe exec);
#  3. sobe UM contêiner avulso dessa imagem, que some no fim (--rm), sem privilégio, com só dois
#     segredos montados para leitura: a URL do banco do Hub e as chaves de selo;
#  4. nesse contêiner, lab/a0d-sankhya.ts abre a credencial de UMA conexão Sankhya (até três sessões,
#     cada uma com login próprio, só nas partes de 1, 2 e 3 sessões), recusa se o Hub está copiando a Metal Nobre naquele instante, lê, e
#     faz o logout de toda sessão aberta, também em erro ou sinal. Um sinal de carga (página acima de
#     30 s, 429, 504) para toda leitura nova.
#
# A saída vai para o log do workflow, que é público: a sonda imprime só códigos, contagens e tempos.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
secrets="${A0D_SECRETS_DIR:-/etc/conexus/secrets}"
image_pattern='^ghcr\.io/developmentconexus-ops/conexus-hub@sha256:[0-9a-f]{64}$'
# Feriados em que o dia inteiro está na janela (palavra do fundador: 2026-11-20 é feriado).
feriados=' 2026-11-20 2026-12-25 2027-01-01 '

say() { printf '{"a0d":"%s","motivo":"%s"}\n' "$1" "$2"; }

hhmm="$(TZ=America/Sao_Paulo date +%H%M)"
weekday="$(TZ=America/Sao_Paulo date +%u)"
today="$(TZ=America/Sao_Paulo date +%F)"
dentro=0
if [ "$weekday" -ge 6 ] || [[ $feriados == *" $today "* ]] || [ "$((10#$hhmm))" -ge 1730 ] || [ "$((10#$hhmm))" -lt 530 ]; then
  dentro=1
fi
if [ "${A0D_IGNORAR_JANELA:-}" != "prova-local" ] && [ "$dentro" -ne 1 ]; then
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
if [ -n "${A0D_CONEXAO_SHA256:-}" ]; then
  prefix+=(--env "A0D_CONEXAO_SHA256=$A0D_CONEXAO_SHA256")
fi

printf '{"a0d":"inicio","quando":"%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
status=0
# Tetos da sonda (PLANO): nenhuma leitura nova depois de 12 minutos; a última leitura em curso pode
# levar até 2 minutos (prazo do gateway) e os logouts até 5 s cada: o timeout de 15 minutos fica abaixo
# dos 17 do workflow. --init põe um init como PID 1, que repassa o SIGTERM do timeout ao node; a sonda o
# recebe, não lê mais nada e faz os logouts.
timeout --kill-after=10 900 docker run --rm --init --pull never --name "conexus-a0d-$$" \
  --user 1000 --read-only --tmpfs /tmp:size=16m \
  --cap-drop ALL --security-opt no-new-privileges --memory 512m --pids-limit 128 \
  --mount "type=bind,source=$secrets/hub_database_url,target=/run/secrets/hub_database_url,readonly" \
  --mount "type=bind,source=$secrets/hub_seal_keys,target=/run/secrets/hub_seal_keys,readonly" \
  --mount "type=bind,source=$here/a0d-sankhya.ts,target=/app/lab/a0d-sankhya.ts,readonly" \
  --env HUB_DATABASE_URL_FILE=/run/secrets/hub_database_url \
  --env HUB_SEAL_KEYS_FILE=/run/secrets/hub_seal_keys \
  "${prefix[@]}" \
  --entrypoint node "$image" /app/lab/a0d-sankhya.ts || status=$?
printf '{"a0d":"fim","codigo":%d}\n' "$status"
exit "$status"
