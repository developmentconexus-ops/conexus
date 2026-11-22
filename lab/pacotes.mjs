// Os clientes do SDK que lab/p3.mjs e lab/gravar-u4.mjs usam, nas versões do package-lock do main. O do
// IAM (a recusa c7) e o do STS (GetCallerIdentity, para a conta) são só do laboratório, na versão do
// CloudFormation.
import { readFileSync } from 'node:fs'

const lock = JSON.parse(readFileSync(process.argv[2], 'utf8')).packages
const version = (name) => {
  const found = lock[`node_modules/${name}`]?.version
  if (!/^\d+\.\d+\.\d+$/.test(found ?? '')) throw new Error(`sem versão de ${name} no package-lock`)
  return found
}
const names = [
  '@aws-sdk/client-cloudformation',
  '@aws-sdk/client-s3tables',
  '@aws-sdk/credential-providers',
  '@aws-sdk/nested-clients',
  '@smithy/node-http-handler',
]
console.log([...names.map((n) => `${n}@${version(n)}`), ...['client-iam', 'client-sts'].map((n) => `@aws-sdk/${n}@${version('@aws-sdk/client-cloudformation')}`)].join(' '))
