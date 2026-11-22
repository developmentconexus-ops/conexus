#!/usr/bin/env bash
# Laboratório: o cadeado da chave do Hub (palavra do fundador, 2026-11-22, "2. Okay"). Roda pelo lab.yml,
# como o usuário runner, que está no grupo docker e por isso age como root por um contêiner de uso único,
# como lab/gancho-0081.sh.
#
# 1. Confere /etc/conexus/secrets e que a chave do Hub ainda não está lá.
# 2. Gera um par RSA 4096 com openssl. A parte privada fica só na memória deste processo e entra por um
#    cano no contêiner, que a grava como /etc/conexus/secrets/.cadeado-hub.pem (root, 0600). Nenhuma cópia
#    dela toca o disco fora desse arquivo.
# 3. Imprime a parte pública e a impressão sha-256 dela. É o que o firstmate usa para trancar a chave;
#    só lab/chave-hub.sh, neste servidor, abre.
#
# Rodar de novo troca o par: vale a última parte pública impressa.
set -euo pipefail

secrets="${CADEADO_SECRETS:-/etc/conexus/secrets}"
privada=.cadeado-hub.pem

para() {
  echo "PARADO: $1" >&2
  exit 1
}

command -v openssl > /dev/null || para "não há openssl no servidor"

echo "== 1. a pasta dos segredos"
[ -d "$secrets" ] || para "não há $secrets"

# A imagem do Hub em execução; senão uma base já baixada. Nunca baixa imagem (--pull never).
imagem="$(timeout 60 docker ps --filter label=com.docker.compose.project=conexus \
  --filter label=com.docker.compose.service=hub --format '{{.Image}}')" || para "o Docker não respondeu"
imagem="${imagem%%$'\n'*}"
if [ -z "$imagem" ]; then
  for candidata in node:24-slim debian:stable-slim; do
    if docker image inspect "$candidata" > /dev/null 2>&1; then
      imagem="$candidata"
      break
    fi
  done
fi
[ -n "$imagem" ] || para "nenhuma imagem com shell já baixada"
echo "imagem do contêiner: $imagem"

root() {
  timeout --kill-after=10 120 docker run --rm -i --pull never --network none --user 0:0 \
    --mount "type=bind,source=$secrets,target=/s" --entrypoint /bin/sh "$imagem" -euc "$1"
}

# Só nomes, donos e modos; nenhum conteúdo.
root 'stat -c "%u:%g %a %n" /s; ls -ln /s | sed "1d"' < /dev/null
root '[ ! -e /s/hub_aws_credentials ]' < /dev/null \
  || para "$secrets/hub_aws_credentials já existe; o cadeado não sobrescreve uma chave"

echo "== 2. o par de chaves"
priv="$(openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 2> /dev/null)" || para "o openssl não gerou o par"
pub="$(printf '%s\n' "$priv" | openssl pkey -pubout)" || para "o openssl não tirou a parte pública"
printf '%s\n' "$priv" | root "
  umask 077
  cat > /s/$privada.next
  chown 0:0 /s/$privada.next
  chmod 0600 /s/$privada.next
  mv -f /s/$privada.next /s/$privada
  stat -c '%u:%g %a %s %n' /s/$privada
" || para "o contêiner não gravou a parte privada"
unset priv

echo "== 3. a parte pública"
printf '%s\n' "$pub"
echo "sha-256 da parte pública (DER): $(printf '%s\n' "$pub" | openssl pkey -pubin -outform DER | sha256sum | cut -d' ' -f1)"
echo "cadeado pronto"
