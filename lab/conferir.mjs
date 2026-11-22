// Laboratório: a conferência das gravações da U4, dentro do contêiner de lab/p3-u4.sh, antes de elas
// saírem. Compara cada gravação com os valores de verdade, não com uma forma: a conta (do
// GetCallerIdentity), o id e o segredo da chave do Hub (do arquivo de credenciais) e qualquer id de chave
// AKIA/ASIA que não seja o inventado. Uma gravação com algum deles é apagada, e sai 1. Só imprime nomes de
// arquivo, nunca o valor achado.
//
// Uso: node conferir.mjs <deps> <pasta das gravações>
import { readdirSync, readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const [deps, out] = process.argv.slice(2)
if (!deps || !out) throw new Error('uso: node conferir.mjs <deps> <pasta>')
const require = createRequire(join(deps, 'package.json'))
const sts = require('@aws-sdk/client-sts')
const { fromIni } = require('@aws-sdk/credential-providers')

const credentials = await fromIni({ profile: 'default' })()
const account = (await new sts.STSClient({ region: process.env.AWS_REGION, credentials })
  .send(new sts.GetCallerIdentityCommand({}))).Account
if (!/^\d{12}$/.test(account ?? '')) throw new Error('falhou ao ler a conta')
const real = [account, credentials.accessKeyId, credentials.secretAccessKey]
const INVENTED_KEY = 'ASIAINVENTED000000001'

let bad = 0
const files = readdirSync(out).filter((name) => name.endsWith('.json')).sort()
for (const name of files) {
  const text = readFileSync(join(out, name), 'utf8')
  const keys = (text.match(/\b(AKIA|ASIA)[A-Z0-9]{16}\b/g) ?? []).filter((key) => key !== INVENTED_KEY)
  if (keys.length > 0 || real.some((value) => text.includes(value))) {
    console.log(`ERRO: ${name} tem a conta, a chave ou um id de chave de verdade; apagado`)
    rmSync(join(out, name))
    bad += 1
  }
}
console.log(`conferência: ${files.length - bad} de ${files.length} limpas`)
process.exit(bad === 0 ? 0 : 1)
