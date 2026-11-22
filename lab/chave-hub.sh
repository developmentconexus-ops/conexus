#!/usr/bin/env bash
# Laboratório: abre o cadeado de lab/cadeado.sh e grava a chave do Hub (passo 3 do passo a passo da conta
# de laboratório; palavra do fundador, 2026-11-22, "2. Okay"). Roda pelo lab.yml, como o usuário runner,
# que age como root por um contêiner de uso único, como lab/gancho-0081.sh.
#
# 1. Lê lab/chave-hub.enc: o base64 da saída de `aws iam create-access-key --user-name conexus-hub-chave`,
#    cifrada pelo firstmate com a parte pública do cadeado (RSA-OAEP, SHA-256).
# 2. Num contêiner com node, como root: decifra com /etc/conexus/secrets/.cadeado-hub.pem, confere que é
#    uma chave de conexus-hub-chave, grava /etc/conexus/secrets/hub_aws_credentials na forma do arquivo de
#    credenciais do SDK (dono 1000:1000, modo 600; nunca sobrescreve) e apaga a parte privada.
# 3. Imprime só o stat do arquivo e o id da chave. O segredo não sai do contêiner: todo erro imprime uma
#    frase fixa, nunca a mensagem do node, que poderia citar o texto decifrado.
set -euo pipefail

secrets="${CADEADO_SECRETS:-/etc/conexus/secrets}"
cifrado="$(dirname "$0")/chave-hub.enc"

para() {
  echo "PARADO: $1" >&2
  exit 1
}

echo "== 1. o texto cifrado"
[ -s "$cifrado" ] || para "não há $cifrado"
echo "sha-256 de $cifrado: $(sha256sum "$cifrado" | cut -d' ' -f1)"
[ -d "$secrets" ] || para "não há $secrets"

# A imagem do Hub em execução; senão a base node já baixada. Nunca baixa imagem (--pull never).
imagem="$(timeout 60 docker ps --filter label=com.docker.compose.project=conexus \
  --filter label=com.docker.compose.service=hub --format '{{.Image}}')" || para "o Docker não respondeu"
imagem="${imagem%%$'\n'*}"
if [ -z "$imagem" ] && docker image inspect node:24-slim > /dev/null 2>&1; then
  imagem=node:24-slim
fi
[ -n "$imagem" ] || para "nenhuma imagem com node já baixada"
echo "imagem do contêiner: $imagem"

echo "== 2. abrir e gravar, como root"
read -r -d '' abrir <<'JS' || true
const fs = require('node:fs')
const crypto = require('node:crypto')
const privada = '/s/.cadeado-hub.pem'
const destino = '/s/hub_aws_credentials'
const fase = { atual: 'ler o cifrado' }
try {
  const cifrado = Buffer.from(fs.readFileSync(0, 'utf8').replace(/\s+/g, ''), 'base64')
  fase.atual = 'ler a parte privada'
  const chave = fs.readFileSync(privada)
  fase.atual = 'decifrar'
  const claro = crypto.privateDecrypt(
    { key: chave, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    cifrado,
  )
  fase.atual = 'ler a chave decifrada'
  const k = JSON.parse(claro.toString('utf8')).AccessKey
  if (
    !k || k.UserName !== 'conexus-hub-chave' || !/^AKIA[A-Z0-9]{16}$/.test(k.AccessKeyId) ||
    typeof k.SecretAccessKey !== 'string' || !/^[A-Za-z0-9/+]{40}$/.test(k.SecretAccessKey)
  ) {
    throw new Error()
  }
  fase.atual = 'gravar o arquivo'
  if (fs.existsSync(destino)) throw new Error()
  const proximo = `${destino}.next`
  fs.writeFileSync(
    proximo,
    `[default]\naws_access_key_id = ${k.AccessKeyId}\naws_secret_access_key = ${k.SecretAccessKey}\n`,
    { mode: 0o600, flag: 'wx' },
  )
  fs.chownSync(proximo, 1000, 1000)
  fs.chmodSync(proximo, 0o600)
  fs.renameSync(proximo, destino)
  fase.atual = 'apagar a parte privada'
  fs.writeFileSync(privada, crypto.randomBytes(fs.statSync(privada).size))
  fs.unlinkSync(privada)
  const s = fs.statSync(destino)
  console.log(`stat: dono ${s.uid}:${s.gid}, modo ${(s.mode & 0o777).toString(8)}, ${s.size} bytes, /etc/conexus/secrets/hub_aws_credentials`)
  console.log(`parte privada: ${fs.existsSync(privada) ? 'AINDA EXISTE' : 'apagada'}`)
  console.log(`id da chave: ${k.AccessKeyId}`)
} catch {
  console.error(`falhou ao ${fase.atual}`)
  process.exit(1)
}
JS
timeout --kill-after=10 120 docker run --rm -i --pull never --network none --user 0:0 \
  --mount "type=bind,source=$secrets,target=/s" --entrypoint node "$imagem" -e "$abrir" < "$cifrado" \
  || para "o contêiner não gravou a chave; nada foi impresso dela"

echo "== 3. a pasta dos segredos depois"
timeout --kill-after=10 120 docker run --rm --pull never --network none --user 0:0 \
  --mount "type=bind,source=$secrets,target=/s,readonly" --entrypoint /bin/sh "$imagem" \
  -euc 'stat -c "%u:%g %a %s %n" /s/hub_aws_credentials; ls -ln /s | sed "1d"'
echo "chave do Hub gravada"
