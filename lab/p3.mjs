// Laboratório: o P3 do Lago 1 (critério 4 do cartão o-lago-da-empresa-nasce-e-some), do servidor, com a
// chave do Hub de AWS_SHARED_CREDENTIALS_FILE. Roda por lab/p3-u4.sh, num contêiner, como uid 1000.
//
// 1. Duas sessões de conexus-hub, marcadas com A e com B (900 s).
// 2. A cria o lago de A pela receita publicada e pelo papel de serviço (a criação aceita); B cria o lago de B.
// 3. As sete recusas da B.4 e as cinco novas do critério 4, todas pela sessão de A.
// 4. Cada sessão apaga a própria pilha e espera DELETE_COMPLETE.
// A saída não leva a conta (trocada por <conta>) nem credencial. Sai 1 se uma recusa não vier, se vier
// com um código que não é de acesso, ou se a criação aceita falhar.
import { createHash, randomInt } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const [deps, repo] = process.argv.slice(2)
const region = process.env.AWS_REGION ?? 'us-east-2'
const require = createRequire(join(deps, 'package.json'))
const cfn = require('@aws-sdk/client-cloudformation')
const s3t = require('@aws-sdk/client-s3tables')
const iamc = require('@aws-sdk/client-iam')
const sts = require('@aws-sdk/client-sts')
const { fromIni, fromTemporaryCredentials } = require('@aws-sdk/credential-providers')

const A = 'EmpresaTesteA0000000000000000001'
const B = 'EmpresaTesteB0000000000000000002'
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const lakeId = () => Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')

const master = fromIni({ profile: 'default' })
const C = (await new sts.STSClient({ region, credentials: master }).send(new sts.GetCallerIdentityCommand({}))).Account
const hide = (text) => String(text).replaceAll(C, '<conta>')

const session = (company) =>
  fromTemporaryCredentials({
    params: {
      RoleArn: `arn:aws:iam::${C}:role/conexus-hub`,
      RoleSessionName: `hub-${company}`,
      Tags: [{ Key: 'conexus-empresa', Value: company }],
      DurationSeconds: 900,
    },
    masterCredentials: master,
    clientConfig: { region },
  })
const sA = session(A)
const sB = session(B)
const stacksA = new cfn.CloudFormationClient({ region, credentials: sA })
const stacksB = new cfn.CloudFormationClient({ region, credentials: sB })
const tablesA = new s3t.S3TablesClient({ region, credentials: sA })
const iamA = new iamc.IAMClient({ region, credentials: sA })

const template = readFileSync(join(repo, 'infra/aws/lake.template.json'))
const V = createHash('sha256').update(template).digest('hex')
const BK = `conexus-receitas-${C}-${region}`
const URL = `https://${BK}.s3.${region}.amazonaws.com/lago/${V}.json`
const CFN = `arn:aws:iam::${C}:role/conexus-cfn`
const bucketArn = (id) => `arn:aws:s3tables:${region}:${C}:bucket/conexus-${id}`

/** O pedido do Hub (aws.ts), com o que cada caso troca. */
function stack(id, company, change = {}) {
  return {
    StackName: `conexus-lago-${id}`,
    ClientRequestToken: id,
    TemplateURL: URL,
    RoleARN: CFN,
    OnFailure: 'DELETE',
    Capabilities: ['CAPABILITY_NAMED_IAM'],
    Parameters: [
      { ParameterKey: 'LakeId', ParameterValue: id },
      { ParameterKey: 'CompanyId', ParameterValue: company },
    ],
    Tags: [
      { Key: 'conexus-empresa', Value: company },
      { Key: 'conexus-modelo', Value: V },
    ],
    ...change,
  }
}

const results = []
const ACCESS = new Set(['AccessDenied', 'AccessDeniedException'])
/** As pilhas que nasceram por engano, para apagar no fim com a sessão que pode. */
const strays = []

async function refused(name, client, command, cleanup) {
  try {
    const answer = await client.send(command)
    results.push({ name, ok: false, got: 'ACEITO' })
    console.log(`FALHOU  ${name}: aceito`)
    if (cleanup) strays.push(cleanup(answer))
  } catch (error) {
    const code = error.name
    const status = error.$metadata?.httpStatusCode
    const ok = ACCESS.has(code)
    results.push({ name, ok, got: `${code} ${status}` })
    console.log(`${ok ? 'recusa ' : 'FALHOU '} ${name}: ${code} ${status} — ${hide(error.message).slice(0, 300)}`)
  }
}

async function until(client, stackId, want) {
  for (;;) {
    let now
    try {
      now = (await client.send(new cfn.DescribeStacksCommand({ StackName: stackId }))).Stacks?.[0]?.StackStatus
    } catch (error) {
      return `${error.name}`
    }
    if (now === want || !now?.endsWith('_IN_PROGRESS')) return now
    await new Promise((resolve) => setTimeout(resolve, 5_000))
  }
}

async function created(name, client, input) {
  try {
    const { StackId } = await client.send(new cfn.CreateStackCommand(input))
    const status = await until(client, StackId, 'CREATE_COMPLETE')
    const ok = status === 'CREATE_COMPLETE'
    results.push({ name, ok, got: status })
    console.log(`${ok ? 'aceito ' : 'FALHOU '} ${name}: ${status}, ${hide(StackId)}`)
    return { StackId, client }
  } catch (error) {
    results.push({ name, ok: false, got: error.name })
    console.log(`FALHOU  ${name}: ${error.name} ${error.$metadata?.httpStatusCode} — ${hide(error.message).slice(0, 300)}`)
    return undefined
  }
}

console.log(`== receita lago/${V}.json; região ${region}`)
console.log('== 1. as sessões')
for (const [label, provider] of [['A', sA], ['B', sB]]) {
  const who = await new sts.STSClient({ region, credentials: provider }).send(new sts.GetCallerIdentityCommand({}))
  console.log(`sessão ${label}: ${hide(who.Arn)}`)
}

console.log('== 2. as criações')
const idA = lakeId()
const idB = lakeId()
const [lakeA, lakeB] = await Promise.all([
  created('criação aceita (A, receita, papel de serviço)', stacksA, stack(idA, A)),
  created('o lago de B (sessão B)', stacksB, stack(idB, B)),
])

console.log('== 3. as recusas, pela sessão de A')
if (lakeB) {
  const asA = (input) => (answer) => ({ StackId: answer.StackId, client: stacksA, input })
  const asB = (answer) => ({ StackId: answer.StackId, client: stacksB })
  const fresh = () => lakeId()
  await refused('c2 sem o papel de serviço', stacksA, new cfn.CreateStackCommand(stack(fresh(), A, { RoleARN: undefined })), asA())
  await refused('c3 com outro papel (conexus-release)', stacksA,
    new cfn.CreateStackCommand(stack(fresh(), A, { RoleARN: `arn:aws:iam::${C}:role/conexus-release` })), asA())
  await refused('c4 pilha marcada com B', stacksA, new cfn.CreateStackCommand(stack(fresh(), B)), asB)
  await refused('c5 ler a pilha de B', stacksA, new cfn.DescribeStacksCommand({ StackName: lakeB.StackId }))
  await refused('c5 apagar a pilha de B', stacksA, new cfn.DeleteStackCommand({ StackName: lakeB.StackId }))
  await refused('c7 criar papel', iamA, new iamc.CreateRoleCommand({
    RoleName: `conexus-p3-${fresh()}`,
    AssumeRolePolicyDocument: '{"Version":"2012-10-17","Statement":[]}',
  }))
  await refused('c7 criar depósito de tabelas', tablesA, new s3t.CreateTableBucketCommand({ name: `conexus-${fresh()}` }))
  await refused('n1 TemplateBody', stacksA,
    new cfn.CreateStackCommand(stack(fresh(), A, { TemplateURL: undefined, TemplateBody: template.toString('utf8') })), asA())
  await refused('n2 TemplateURL fora de lago/', stacksA,
    new cfn.CreateStackCommand(stack(fresh(), A, { TemplateURL: `https://${BK}.s3.${region}.amazonaws.com/fora/${V}.json` })), asA())
  await refused('n3 a receita na forma de caminho', stacksA,
    new cfn.CreateStackCommand(stack(fresh(), A, { TemplateURL: `https://s3.${region}.amazonaws.com/${BK}/lago/${V}.json` })), asA())
  await refused('n4 DeleteTableBucket de B', tablesA, new s3t.DeleteTableBucketCommand({ tableBucketARN: bucketArn(idB) }))
  await refused('n5 DeleteNamespace de B', tablesA, new s3t.DeleteNamespaceCommand({ tableBucketARN: bucketArn(idB), namespace: 'raw' }))
} else {
  console.log('PARADO: sem o lago de B as recusas não provam nada')
}

console.log('== 4. a saída')
for (const { StackId, client } of [lakeA, lakeB, ...strays].filter(Boolean)) {
  try {
    await client.send(new cfn.DeleteStackCommand({ StackName: StackId }))
    console.log(`apagada: ${hide(StackId)} → ${await until(client, StackId, 'DELETE_COMPLETE')}`)
  } catch (error) {
    console.log(`NÃO APAGOU ${hide(StackId)}: ${error.name}`)
  }
}

const bad = results.filter((r) => !r.ok)
console.log(`== resumo: ${results.length - bad.length} de ${results.length} como o critério 4 diz`)
if (bad.length > 0) {
  for (const r of bad) console.log(`  fora do esperado: ${r.name}: ${r.got}`)
  process.exit(1)
}
