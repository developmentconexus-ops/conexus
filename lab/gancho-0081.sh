#!/usr/bin/env bash
# Laboratório: troca o gancho do executor (/etc/conexus/runner-job-started.sh) pelo do main de hoje,
# pela D1 do fundador (2026-11-22) no estudo do acesso ao servidor. Roda pelo lab.yml, como o usuário
# runner, que está no grupo docker e por isso age como root por um contêiner de uso único.
#
# 1. Baixa o main público e tira dele infra/runner-job-started.sh.
# 2. Mostra o sha-256 do gancho instalado e a linha do .env do executor que o nomeia (só essa linha).
# 3. Testa o gancho novo antes de trocar: um push no main com a cabeça do main e o espelho real deve
#    passar; um evento release deve ser recusado. Se não der isso, para sem trocar nada.
# 4. Troca como root num contêiner com uma imagem já baixada (a do Hub em execução, de preferência):
#    guarda o antigo em runner-job-started.sh.antes-0081, instala o novo (root, 0755) e confere o sha-256.
#    Não reinicia o serviço: o .env já nomeia este caminho e o executor lê o arquivo a cada trabalho.
# 5. Resumo.
#
# Nada de segredo na saída; só escreve em /etc/conexus. O teste do passo 3 faz o que o gancho faz em
# todo trabalho: busca o main no espelho. As variáveis GANCHO_* existem só para o teste local.
set -euo pipefail

origem="${GANCHO_ORIGEM:-https://github.com/developmentconexus-ops/conexus.git}"
config_dir="${GANCHO_CONFIG_DIR:-/etc/conexus}"
runner_env="${GANCHO_RUNNER_ENV:-/home/runner/actions-runner/.env}"
espelho="${GANCHO_ESPELHO:-/var/lib/conexus/main.git}"
instalado="$config_dir/runner-job-started.sh"
antes="$config_dir/runner-job-started.sh.antes-0081"

para() {
  echo "PARADO: $1" >&2
  echo "nada foi trocado" >&2
  exit 1
}

# No RUNNER_TEMP do trabalho, um caminho do próprio servidor, que o Docker monta.
tmp="$(mktemp -d "${RUNNER_TEMP:-/tmp}/gancho-0081.XXXXXX")"
trap 'rm -rf "$tmp"' EXIT

echo "== 1. o gancho do main"
git -C "$tmp" init --quiet repo
timeout --kill-after=10 120 git -C "$tmp/repo" fetch --quiet --no-tags --depth 1 "$origem" main \
  || para "não consegui baixar o main de $origem"
sha_main="$(git -C "$tmp/repo" rev-parse FETCH_HEAD)"
novo="$tmp/runner-job-started.sh"
git -C "$tmp/repo" show FETCH_HEAD:infra/runner-job-started.sh > "$novo"
sha256_novo="$(sha256sum "$novo" | cut -d' ' -f1)"
echo "sha do main: $sha_main"
echo "sha-256 do gancho do main: $sha256_novo"

echo "== 2. o gancho instalado"
[ -f "$instalado" ] || para "não há gancho em $instalado"
sha256_antigo="$(sha256sum "$instalado" | cut -d' ' -f1)"
echo "sha-256 do gancho instalado: $sha256_antigo"
[ -r "$runner_env" ] || para "não consigo ler o .env do executor em $runner_env"
linha_env="$(grep '^ACTIONS_RUNNER_HOOK_JOB_STARTED=' "$runner_env" || true)"
echo "linha do .env: ${linha_env:-nenhuma}"
[ "$linha_env" = "ACTIONS_RUNNER_HOOK_JOB_STARTED=$instalado" ] \
  || para "o .env do executor não nomeia $instalado; trocar o arquivo não mudaria o gancho"

echo "== 3. teste do gancho novo, antes de trocar"
[ -d "$espelho" ] || para "não há espelho do main em $espelho"
# O ambiente do trabalho de lab (workflow_dispatch) fica de fora: só passam as variáveis do caso.
rodar_gancho() {
  env -i PATH="$PATH" HOME="${HOME:-/}" GITHUB_EVENT_NAME="$1" GITHUB_REF="$2" GITHUB_SHA="$sha_main" \
    bash "$novo" "$espelho"
}

status=0
rodar_gancho push refs/heads/main 2> "$tmp/push.err" || status=$?
sed 's/^/  push: /' "$tmp/push.err"
if [ "$status" -eq 0 ]; then
  teste_push=aceito
else
  teste_push="recusado (saída $status)"
fi
echo "push no main com $sha_main: $teste_push"

status=0
rodar_gancho release refs/tags/v0.0.0 2> "$tmp/release.err" || status=$?
sed 's/^/  release: /' "$tmp/release.err"
if [ "$status" -ne 0 ] && grep -q '^refused: ' "$tmp/release.err"; then
  teste_release=recusado
elif [ "$status" -eq 0 ]; then
  teste_release=aceito
else
  teste_release="falhou sem recusar (saída $status)"
fi
echo "release: $teste_release"

[ "$teste_push" = aceito ] || para "o gancho novo não aceitou o push no main"
[ "$teste_release" = recusado ] || para "o gancho novo não recusou o release"

echo "== 4. troca como root"
if [ "$sha256_antigo" = "$sha256_novo" ]; then
  echo "o gancho instalado já é o do main; nada a trocar"
  troca="já estava instalado"
else
  # A imagem do Hub em execução; senão uma base já baixada. Nunca baixa imagem (--pull never).
  imagem="$(timeout 60 docker ps --filter label=com.docker.compose.project=conexus \
    --filter label=com.docker.compose.service=hub --format '{{.Image}}')" || para "o Docker não respondeu"
  imagem="${imagem%%$'\n'*}"
  if [ -z "$imagem" ]; then
    for candidata in node:24-slim python:3.13-slim debian:stable-slim; do
      if docker image inspect "$candidata" > /dev/null 2>&1; then
        imagem="$candidata"
        break
      fi
    done
  fi
  [ -n "$imagem" ] || para "nenhuma imagem com shell já baixada"
  echo "imagem do contêiner: $imagem"
  # Guarda o antigo só se ainda não houver cópia, para uma segunda rodada não apagar o original.
  # Instala ao lado e renomeia, para o executor nunca ler um arquivo pela metade.
  timeout --kill-after=10 120 docker run --rm --pull never --network none --user 0:0 \
    --mount "type=bind,source=$config_dir,target=/c" \
    --mount "type=bind,source=$novo,target=/novo,readonly" \
    --entrypoint /bin/sh "$imagem" -euc '
      [ -e /c/runner-job-started.sh.antes-0081 ] || cp -p /c/runner-job-started.sh /c/runner-job-started.sh.antes-0081
      install -o 0 -g 0 -m 0755 /novo /c/runner-job-started.sh.next
      mv -f /c/runner-job-started.sh.next /c/runner-job-started.sh
      ls -ln /c/runner-job-started.sh /c/runner-job-started.sh.antes-0081
    ' || para "o contêiner da troca falhou; confira $instalado e $antes"
  troca=trocado
fi
sha256_final="$(sha256sum "$instalado" | cut -d' ' -f1)"
echo "sha-256 instalado agora: $sha256_final"
if [ -e "$antes" ]; then
  echo "sha-256 do antigo guardado: $(sha256sum "$antes" | cut -d' ' -f1)"
fi
[ "$sha256_final" = "$sha256_novo" ] || {
  echo "ERRO: o sha-256 instalado não é o do main" >&2
  exit 1
}

echo "== 5. resumo"
echo "sha do main:                 $sha_main"
echo "sha-256 do gancho do main:   $sha256_novo"
echo "sha-256 do gancho anterior:  $sha256_antigo"
echo "sha-256 instalado agora:     $sha256_final"
echo "teste push no main:          $teste_push"
echo "teste release:               $teste_release"
echo "troca:                       $troca"
echo "gancho 0081 instalado"
