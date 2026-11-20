#!/usr/bin/env bash
# P3, execução 2 de 3: abre a chave de teste e mede as perguntas da V3 da VPS.
# - lab/p3-chave.enc (do ramo) foi cifrado com a chave pública que p3-preparar.sh imprimiu; só a privada da pasta 700 abre.
# - O texto aberto vira o arquivo de credenciais da pasta (600); o Python o acha pela cadeia padrão do SDK
#   (AWS_SHARED_CREDENTIALS_FILE), sem chave no código nem no ambiente.
# - Nada sensível no log: o Python imprime só tempos, contagens e códigos.
set -uo pipefail
umask 077
P="${HOME:?}/.conexus-p3"
AQUI="$(cd "$(dirname "$0")" && pwd)"
[ -s "$P/vps.key" ] || { echo "sem par de chaves: rodar p3-preparar.sh antes"; exit 1; }
[ -s "$AQUI/p3-chave.enc" ] || { echo "sem lab/p3-chave.enc no ramo"; exit 1; }

echo "chave pública da pasta, sha256 do DER: $(openssl pkey -in "$P/vps.key" -pubout -outform DER 2>/dev/null | sha256sum | cut -c1-16)"
if base64 -d "$AQUI/p3-chave.enc" | openssl pkeyutl -decrypt -inkey "$P/vps.key" \
     -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 -pkeyopt rsa_mgf1_md:sha256 -out "$P/credentials" 2>/dev/null; then
  echo "credencial: aberta na pasta, modo $(stat -c %a "$P/credentials"), $(grep -c '^aws_' "$P/credentials") campos"
else
  echo "credencial: não abriu"; rm -f "$P/credentials"; exit 1
fi
printf '[default]\nregion = us-east-2\n' > "$P/config"

if [ -x "$P/venv/bin/python" ]; then PY="$P/venv/bin/python"; export PYTHONPATH="$AQUI"
else PY=python3; export PYTHONPATH="$AQUI:$P/py"; fi

# só o arquivo: nenhuma variável de chave no ambiente, nenhum perfil, nenhum proxy herdado
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE
export AWS_SHARED_CREDENTIALS_FILE="$P/credentials" AWS_CONFIG_FILE="$P/config" AWS_EC2_METADATA_DISABLED=true
cd "$AQUI/.." && "$PY" "$AQUI/p3_medir.py"
st=$?
echo "fim: p3-medir (saída $st)"
exit $st
