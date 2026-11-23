// Acrescenta ao hub.env as linhas HUB_AWS_* que faltam. Roda como root, num contêiner de uso único
// (lab/hub-env-aws.sh), com /etc/conexus montado. A conta chega por CONTA, nunca por argumento.
// Idempotente: nada se a linha já existe com o mesmo valor; para, sem escrever, se existe com outro.
// Mantém o dono do arquivo e o modo 0400 (docs/how-to/hub-mail.md). Imprime só nomes.
import { chownSync, closeSync, fsyncSync, openSync, readFileSync, renameSync, statSync, writeSync } from 'node:fs'
import { dirname, join } from 'node:path'

const [file, withRegion] = process.argv.slice(2)
const account = process.env.CONTA ?? ''
const stop = (why) => {
  console.error(`PARADO: ${why}`)
  process.exit(1)
}
if (!/^[0-9]{12}$/.test(account)) stop('CONTA não tem 12 dígitos')

// Os formatos de apps/server/src/platform/config-aws.ts; os nomes de infra/aws/lib/names.ts:26-27,41.
const wanted = [
  ['HUB_AWS_ACCOUNT', account],
  ['HUB_AWS_HUB_ROLE_ARN', `arn:aws:iam::${account}:role/conexus-hub`],
  ['HUB_AWS_SERVICE_ROLE_ARN', `arn:aws:iam::${account}:role/conexus-cfn`],
  ['HUB_AWS_TEMPLATE_BUCKET', `conexus-receitas-${account}-us-east-2`],
  ...(withRegion === '1' ? [['HUB_AWS_REGION', 'us-east-2']] : []),
]

const before = statSync(file)
const text = readFileSync(file, 'utf8')
const lines = text.split('\n')
const missing = []
for (const [name, value] of wanted) {
  const found = lines.filter((line) => line.startsWith(`${name}=`))
  if (found.length > 1) stop(`${name} aparece ${found.length} vezes`)
  if (found.length === 1) {
    if (found[0] !== `${name}=${value}`) stop(`${name} já existe com outro valor`)
    console.log(`já estava: ${name}`)
  } else missing.push([name, value])
}
if (missing.length === 0) {
  console.log('nada a acrescentar')
  process.exit(0)
}

const added = missing.map(([name, value]) => `${name}=${value}\n`).join('')
const next = (text === '' || text.endsWith('\n') ? text : `${text}\n`) + added
const temporary = join(dirname(file), `.hub.env.${process.pid}`)
const fd = openSync(temporary, 'wx', 0o400)
writeSync(fd, next)
fsyncSync(fd)
closeSync(fd)
chownSync(temporary, before.uid, before.gid)
renameSync(temporary, file)
for (const [name] of missing) console.log(`acrescentada: ${name}`)
