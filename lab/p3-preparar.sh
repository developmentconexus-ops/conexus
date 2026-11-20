#!/usr/bin/env bash
# P3, execução 1 de 3: prepara a VPS para receber a chave de teste sem que ela passe por log público.
# - Cria uma pasta 700 do usuário do executor, fora do diretório de trabalho do job (some no fim, p3-limpar.sh).
# - Gera ali um par RSA 4096 (openssl); só a chave PÚBLICA sai no log. A privada nunca sai da pasta.
# - Confere se a saída da VPS para a internet é o IP que a trava vai exigir (imprime só "igual" ou "diferente").
# - Prepara o boto3 dentro da pasta (venv; se o python3 não tiver venv, um contêiner avulso python:3.13-slim
#   instala o boto3 na pasta; nenhum contêiner do Hub é tocado nem listado).
# Imprime só versões, códigos, tempos e a chave pública. Nenhum caminho da máquina.
set -uo pipefail
umask 077
IP_TRAVA=179.199.156.252
BOTO=1.44.6
P="${HOME:?}/.conexus-p3"

install -d -m 700 "$P"
case "$(readlink -f "$P")" in "$(readlink -f "$PWD")"*) echo "pasta: DENTRO do diretório de trabalho, parar"; exit 1 ;; esac
echo "pasta: criada fora do diretório de trabalho, modo $(stat -c %a "$P"), dono é o executor: $([ "$(stat -c %U "$P")" = "$(id -un)" ] && echo sim || echo não)"

echo "ferramentas: $(openssl version 2>&1 | head -1) | $(python3 --version 2>&1) | curl $(curl --version 2>/dev/null | head -1 | cut -d' ' -f2) | docker $(docker --version 2>/dev/null | cut -d' ' -f3 | tr -d , || echo ausente) | aws $(command -v aws >/dev/null && echo presente || echo ausente)"

if [ ! -s "$P/vps.key" ]; then
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:4096 -out "$P/vps.key" 2>/dev/null || { echo "genpkey falhou"; exit 1; }
  echo "par: gerado agora"
else
  echo "par: já existia (reaproveitado)"
fi
chmod 600 "$P/vps.key"
openssl pkey -in "$P/vps.key" -pubout -out "$P/vps.pub" || exit 1
echo "chave pública, sha256 do DER: $(openssl pkey -pubin -in "$P/vps.pub" -outform DER | sha256sum | cut -c1-16)"
echo "----- INÍCIO DA CHAVE PÚBLICA DA VPS -----"
cat "$P/vps.pub"
echo "----- FIM DA CHAVE PÚBLICA DA VPS -----"

# a saída para a internet: o IP que a AWS verá
for u in https://checkip.amazonaws.com https://api.ipify.org; do
  ip=$(curl -fsS --max-time 10 "$u" 2>/dev/null | tr -d '[:space:]')
  [ -n "$ip" ] && { echo "IP de saída ($u): $([ "$ip" = "$IP_TRAVA" ] && echo igual ao da trava || echo DIFERENTE do da trava)"; break; }
done
# proxy no ambiente do job? (a trava depende da saída direta)
echo "proxy no ambiente: $(env | grep -ciE '^(https?|all)_proxy=') variáveis"

# o boto3 dentro da pasta
if [ -x "$P/venv/bin/python" ] && "$P/venv/bin/python" -c "import boto3" 2>/dev/null; then
  echo "boto3: venv já pronto"
elif python3 -m venv "$P/venv" >/dev/null 2>&1 && "$P/venv/bin/pip" install -q "boto3==$BOTO" >/dev/null 2>&1; then
  echo "boto3: venv criado ($("$P/venv/bin/python" -c 'import boto3;print(boto3.__version__)'))"
else
  rm -rf "$P/venv"
  echo "boto3: python3 sem venv/pip; tentando contêiner avulso"
  if docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp -v "$P:/w" python:3.13-slim \
       pip install -q --no-cache-dir --target /w/py "boto3==$BOTO" >/dev/null 2>&1; then
    echo "boto3: instalado na pasta pelo contêiner ($(PYTHONPATH="$P/py" python3 -c 'import boto3;print(boto3.__version__)' 2>&1))"
  else
    echo "boto3: FALHOU"
  fi
fi

# tempo de rede até os serviços (sem credencial): conexão TCP+TLS
for h in sts.us-east-2.amazonaws.com athena.us-east-2.amazonaws.com; do
  for i in 1 2 3; do
    curl -s -o /dev/null --max-time 10 -w "rede $h: tcp %{time_connect}s tls %{time_appconnect}s total %{time_total}s\n" "https://$h/"
  done
done
echo "fim: p3-preparar"
