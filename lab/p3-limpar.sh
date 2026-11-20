#!/usr/bin/env bash
# P3, execução 3 de 3: depois que a chave foi apagada na AWS, prova que ela não vale mais e apaga tudo da VPS.
# - Uma chamada sts:GetCallerIdentity com o arquivo de credenciais: a AWS tem de recusar (InvalidClientTokenId).
# - Sobrescreve e apaga a credencial e o par de chaves, apaga a pasta inteira, e prova que nada sobrou.
set -uo pipefail
P="${HOME:?}/.conexus-p3"
AQUI="$(cd "$(dirname "$0")" && pwd)"
if [ -s "$P/credentials" ]; then
  if [ -x "$P/venv/bin/python" ]; then PY="$P/venv/bin/python"; else PY=python3; export PYTHONPATH="$P/py"; fi
  unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN AWS_PROFILE
  AWS_SHARED_CREDENTIALS_FILE="$P/credentials" AWS_CONFIG_FILE="$P/config" AWS_EC2_METADATA_DISABLED=true "$PY" - <<'EOF'
import boto3
from botocore.exceptions import ClientError
try:
    boto3.client("sts", region_name="us-east-2").get_caller_identity()
    print("chave apagada na AWS? NÃO: a chamada passou")
except ClientError as e:
    print("chave apagada na AWS? sim, a AWS recusou:", e.response["Error"]["Code"])
EOF
else
  echo "sem credencial na pasta"
fi
if [ -d "$P" ]; then
  find "$P" -maxdepth 1 -type f \( -name credentials -o -name 'vps.*' -o -name config \) -exec shred -u -z {} + 2>/dev/null
  rm -rf "$P"
fi
if [ -e "$P" ]; then echo "pasta: AINDA EXISTE"; exit 1; fi
echo "pasta: não existe mais (par de chaves, credencial e venv apagados)"
left=$(find "$HOME" -maxdepth 2 -name '.conexus-p3*' 2>/dev/null | wc -l)
echo "restos com o nome da pasta no HOME: $left"
grep -rl "BEGIN PRIVATE KEY" "$AQUI/.." 2>/dev/null | wc -l | sed 's/^/chaves privadas no diretório de trabalho: /'
echo "fim: p3-limpar"
