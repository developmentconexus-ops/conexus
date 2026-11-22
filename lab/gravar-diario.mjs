// A prova do critério 35 pelo diário da pilha (opção d do fundador, 2026-11-22): o que o
// DescribeStackEvents de uma criação que falhou diz do depósito, pela receita publicada e só com a chave
// do Hub, na conta de laboratório. Roda no servidor por lab/diario.sh.
//
// Uso: node gravar-diario.mjs <deps> <raiz do repositório> <região> <pasta de saída>
//
// Três cenários, escolhidos por CENARIOS (padrão C), cada um com uma pilha que falha com OnFailure
// DELETE, lida pelo id depois de DELETE_COMPLETE, e a verdade conferida por um GetTableBucket da sessão
// do Hub:
//  N. o nome preso: a pilha 1 (lago X) nasce e se apaga; logo depois a pilha 2, com outro nome e o
//     mesmo lago X, pede o depósito conexus-X, cujo nome ainda está preso. No run 45081093044: o
//     depósito CREATE_FAILED e, depois, DELETE_COMPLETE de um depósito que a pilha não criou.
//  A. o papel e o grupo de trabalho já existem (os da pilha 3). No run 45081093044 a validação do
//     CloudFormation recusou a pilha 4 antes de qualquer recurso: nenhum evento do depósito.
//  C. o caso comum: o depósito CREATE_COMPLETE, um recurso depois falha, e o desfazer o apaga
//     (scenarioC diz como, só com as permissões do Hub).
// Nada fica de pé no fim, e um depósito que sobrar é apagado e dito.
import { createHash, randomInt } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { Readable } from 'node:stream'

const [deps, repo, region, out] = process.argv.slice(2)
if (!deps || !repo || !region || !out) throw new Error('uso: node gravar-diario.mjs <deps> <repo> <região> <saída>')
const run = process.env.LAB_RUN
if (!run) throw new Error('falta LAB_RUN')
const SOURCE = `criterion 35 by the stack's events, from the Hub server with the Hub key (lab run ${run}), laboratory account, values changed (S40)`
const require = createRequire(join(deps, 'package.json'))
const cfn = require('@aws-sdk/client-cloudformation')
const s3t = require('@aws-sdk/client-s3tables')
const stsLab = require('@aws-sdk/client-sts')
const { fromIni, fromTemporaryCredentials } = require('@aws-sdk/credential-providers')
const { NodeHttpHandler } = require('@smithy/node-http-handler')
const SDK = require('@aws-sdk/client-cloudformation/package.json').version

const COMPANY = 'EmpresaTesteA0000000000000000001'
const INVENTED_ACCOUNT = '111122223333'
const LOCK_SECONDS = 620
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const lakeId = () => Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

mkdirSync(out, { recursive: true })
const base = fromIni({ profile: 'default' })
const account = (await new stsLab.STSClient({ region, credentials: base }).send(new stsLab.GetCallerIdentityCommand({}))).Account
if (!/^\d{12}$/.test(account ?? '')) throw new Error('falhou ao ler a conta')

let last
const handler = new NodeHttpHandler({ requestTimeout: 30_000, connectionTimeout: 5_000 })
const recording = {
  metadata: handler.metadata,
  destroy: () => handler.destroy(),
  updateHttpClientConfig: (k, v) => handler.updateHttpClientConfig(k, v),
  httpHandlerConfigs: () => handler.httpHandlerConfigs(),
  async handle(request, options) {
    const { response } = await handler.handle(request, options)
    const chunks = []
    for await (const chunk of response.body) chunks.push(Buffer.from(chunk))
    const body = Buffer.concat(chunks)
    last = {
      status: response.statusCode,
      contentType: response.headers['content-type'],
      errorType: response.headers['x-amzn-errortype'],
      body: body.toString('utf8'),
    }
    response.body = Readable.from([body])
    return { response }
  },
}

function scrub(text) {
  return text
    .replaceAll(account, INVENTED_ACCOUNT)
    .replace(/<RequestId>[^<]*</g, '<RequestId>00000000-0000-4000-8000-000000000000<')
    .replace(/<EventId>[0-9a-f-]{36}</g, '<EventId>00000000-0000-4000-8000-000000000002<')
    .replace(/"ownerAccountId":"[^"]*"/g, `"ownerAccountId":"${INVENTED_ACCOUNT}"`)
    .replace(/"tableBucketId":"[^"]*"/g, '"tableBucketId":"00000000-0000-4000-8000-000000000003"')
}

function save(name, service, api) {
  const record = {
    service,
    api,
    sdk: `@aws-sdk/client-${service} ${SDK}`,
    recordedAt: new Date().toISOString().slice(0, 10),
    source: SOURCE,
    status: last.status,
    contentType: last.contentType,
    errorType: last.errorType === undefined ? undefined : scrub(last.errorType),
    body: scrub(last.body),
  }
  writeFileSync(join(out, `${name}.json`), `${JSON.stringify(record, null, 2)}\n`)
  console.log(`gravado ${name}: ${last.status}`)
}

/** Sends through the recording handler and saves the raw answer under `name`, accepted or refused. */
async function recorded(name, client, command, service) {
  last = undefined
  const api = command.constructor.name.replace(/Command$/, '')
  try {
    const answer = await client.send(command)
    save(name, service, api)
    return answer
  } catch (error) {
    if (last === undefined) throw error
    save(name, service, api)
    return { error: error.name }
  }
}

const credentials = fromTemporaryCredentials({
  params: {
    RoleArn: `arn:aws:iam::${account}:role/conexus-hub`,
    RoleSessionName: `hub-${COMPANY}`,
    Tags: [{ Key: 'conexus-empresa', Value: COMPANY }],
    DurationSeconds: 900,
  },
  masterCredentials: base,
  clientConfig: { region, requestHandler: handler },
})
const stacks = new cfn.CloudFormationClient({ region, credentials, requestHandler: recording })
const tables = new s3t.S3TablesClient({ region, credentials, requestHandler: recording })
const bucketArn = (lake) => `arn:aws:s3tables:${region}:${account}:bucket/conexus-${lake}`

const template = readFileSync(join(repo, 'infra/aws/lake.template.json'))
const version = createHash('sha256').update(template).digest('hex')
const templates = `conexus-receitas-${account}-${region}`
console.log(`receita: lago/${version}.json`)

/** CreateStack as the Hub sends it, with the stack's name and the lake's id drawn apart. */
async function create(stackLake, lake) {
  const created = await stacks.send(new cfn.CreateStackCommand({
    StackName: `conexus-lago-${stackLake}`,
    ClientRequestToken: stackLake,
    TemplateURL: `https://${templates}.s3.${region}.amazonaws.com/lago/${version}.json`,
    RoleARN: `arn:aws:iam::${account}:role/conexus-cfn`,
    OnFailure: 'DELETE',
    Capabilities: ['CAPABILITY_NAMED_IAM'],
    Parameters: [{ ParameterKey: 'LakeId', ParameterValue: lake }, { ParameterKey: 'CompanyId', ParameterValue: COMPANY }],
    Tags: [{ Key: 'conexus-empresa', Value: COMPANY }, { Key: 'conexus-modelo', Value: version }],
  }))
  console.log(`pilha conexus-lago-${stackLake} (lago ${lake}) criada`)
  made.push(created.StackId)
  return created.StackId
}

async function settled(stackId) {
  for (let i = 0; i < 200; i += 1) {
    const read = await stacks.send(new cfn.DescribeStacksCommand({ StackName: stackId }))
    const now = read.Stacks?.[0]?.StackStatus
    if (!now?.endsWith('_IN_PROGRESS')) {
      console.log(`  ${now}`)
      return now
    }
    await sleep(3_000)
  }
  throw new Error('a pilha não parou em 10 minutos')
}

/** Every event of the stack, by its id; the first page is recorded, and each line printed. */
async function diary(stackId, name) {
  const events = []
  let next
  for (let page = 1; page <= 5; page += 1) {
    const command = new cfn.DescribeStackEventsCommand({ StackName: stackId, NextToken: next })
    const read = page === 1
      ? await recorded(name, stacks, command, 'cloudformation')
      : await stacks.send(command)
    if (read.error) throw new Error(`DescribeStackEvents recusado: ${read.error}`)
    events.push(...(read.StackEvents ?? []))
    next = read.NextToken
    if (next === undefined) break
    console.log(`  (a página ${page} tem continuação)`)
  }
  for (const e of events) {
    const reason = (e.ResourceStatusReason ?? '').slice(0, 140)
    console.log(`  ${e.Timestamp?.toISOString()} ${e.LogicalResourceId} ${e.ResourceType} ${e.ResourceStatus} ${reason}`)
  }
  const bucket = events.filter((e) => e.ResourceType === 'AWS::S3Tables::TableBucket')
  console.log(`  diário do depósito, do mais novo: ${bucket.map((e) => e.ResourceStatus).join(' <- ') || 'nenhum evento'}`)
  return events
}

/** The truth: does the bucket exist? The Hub's session reads it (200) or is refused (403, no tag). */
async function truth(lake, name) {
  const read = await recorded(name, tables, new s3t.GetTableBucketCommand({ tableBucketARN: bucketArn(lake) }), 's3tables')
  const there = read.error === undefined
  console.log(`  verdade: conexus-${lake} ${there ? 'EXISTE' : `não lido (${read.error})`}`)
  return there
}

async function clearBucket(lake) {
  const tableBucketARN = bucketArn(lake)
  const listed = await tables.send(new s3t.ListNamespacesCommand({ tableBucketARN }))
  for (const { namespace } of listed.namespaces ?? []) {
    await tables.send(new s3t.DeleteNamespaceCommand({ tableBucketARN, namespace: namespace.join('.') }))
  }
  await tables.send(new s3t.DeleteTableBucketCommand({ tableBucketARN }))
  console.log(`  conexus-${lake} apagado pela sessão do Hub`)
}

/** Deletes a stack; a DELETE_FAILED retains only what failed, up to three times. */
async function removeStack(stackId) {
  await stacks.send(new cfn.DeleteStackCommand({ StackName: stackId }))
  await sleep(3_000)
  for (let round = 0; round < 3; round += 1) {
    const now = await settled(stackId)
    if (now === 'DELETE_COMPLETE') return
    if (now !== 'DELETE_FAILED') throw new Error(`a pilha apagada parou em ${now}`)
    const read = await stacks.send(new cfn.DescribeStackEventsCommand({ StackName: stackId }))
    const failed = [...new Set((read.StackEvents ?? [])
      .filter((e) => e.ResourceStatus === 'DELETE_FAILED' && e.ResourceType !== 'AWS::CloudFormation::Stack')
      .map((e) => e.LogicalResourceId))]
    console.log(`  DELETE_FAILED em ${failed.join(', ')}; de novo, guardando esses`)
    await stacks.send(new cfn.DeleteStackCommand({ StackName: stackId, RetainResources: failed }))
    await sleep(3_000)
  }
  throw new Error('a pilha não saiu em três rodadas')
}

const outcome = {}
const made = []

async function scenarioN() {
  console.log('== N. o depósito nunca criado')
  const x = lakeId()
  const s1 = await create(x, x)
  if ((await settled(s1)) !== 'CREATE_COMPLETE') throw new Error('a pilha 1 não nasceu')
  await removeStack(s1)
  const s2 = await create(lakeId(), x)
  const n = await settled(s2)
  if (n === 'CREATE_COMPLETE') {
    console.log('  o nome não ficou preso: a pilha 2 nasceu; apagando, cenário N sem resultado')
    await removeStack(s2)
    outcome.N = 'sem falha'
  } else {
    await diary(s2, 'describe-stack-events-deposito-nunca-criado')
    outcome.N = (await truth(x, 'get-table-bucket-depois-nunca-criado')) ? 'SOBROU' : 'não existe'
    if (outcome.N === 'SOBROU') await clearBucket(x)
  }
}

async function scenarioA() {
  console.log('== A. o papel e o grupo de trabalho já existem')
  const z = lakeId()
  const s3 = await create(z, z)
  if ((await settled(s3)) !== 'CREATE_COMPLETE') throw new Error('a pilha 3 não nasceu')
  await clearBucket(z)
  console.log(`  esperando ${LOCK_SECONDS} s para o nome de conexus-${z} soltar`)
  await sleep(LOCK_SECONDS * 1000)
  const s4 = await create(lakeId(), z)
  const a = await settled(s4)
  if (a === 'CREATE_COMPLETE') {
    console.log('  a pilha 4 nasceu; cenário A sem resultado')
    await removeStack(s4)
    outcome.A = 'sem falha'
  } else {
    await diary(s4, 'describe-stack-events-deposito-apagado')
    outcome.A = (await truth(z, 'get-table-bucket-depois-apagado')) ? 'SOBROU' : 'não existe'
    if (outcome.A === 'SOBROU') await clearBucket(z)
  }
  console.log('== a pilha 3, que ainda tem o papel e o grupo de Z')
  await removeStack(s3)
}

/** Events of the stack, newest first, no recording: the watch of scenario C. */
async function eventsNow(stackId) {
  const read = await stacks.send(new cfn.DescribeStackEventsCommand({ StackName: stackId }))
  return read.StackEvents ?? []
}

/**
 * C. The common case: the bucket CREATE_COMPLETE, a later resource fails, and the undoing deletes the
 * bucket. As soon as the namespace `current` is CREATE_COMPLETE, the Hub's session removes the
 * namespaces and the bucket (the leftover's own permissions): the two Lake Formation grants, which
 * depend on `current`, fail, and OnFailure DELETE undoes the stack. Up to three tries, in case the
 * stack finishes before the watch acts.
 */
async function scenarioC() {
  console.log('== C. o depósito criado, um recurso depois falha, e o depósito apagado')
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const lake = lakeId()
    const stackId = await create(lake, lake)
    let acted = false
    for (let i = 0; i < 600 && !acted; i += 1) {
      const events = await eventsNow(stackId)
      const done = (logical) =>
        events.some((e) => e.LogicalResourceId === logical && e.ResourceStatus === 'CREATE_COMPLETE')
      const stackDone = events.some(
        (e) => e.ResourceType === 'AWS::CloudFormation::Stack' && !e.ResourceStatus?.endsWith('_IN_PROGRESS'),
      )
      if (stackDone) break
      if (done('Bucket') && done('Raw') && done('Current')) {
        await clearBucket(lake)
        acted = true
      } else await sleep(500)
    }
    const now = await settled(stackId)
    console.log(`  tentativa ${attempt}: ${acted ? 'áreas e depósito apagados por fora' : 'não deu tempo'}; a pilha ${now}`)
    if (now === 'DELETE_COMPLETE') {
      await diary(stackId, 'describe-stack-events-criado-e-apagado')
      outcome.C = (await truth(lake, 'get-table-bucket-depois-criado-e-apagado')) ? 'SOBROU' : 'não existe'
      if (outcome.C === 'SOBROU') await clearBucket(lake)
      return
    }
    console.log('  a pilha não falhou; apagando e tentando de novo')
    await removeStack(stackId)
  }
  outcome.C = 'sem falha em três tentativas'
}

async function main() {
  const wanted = (process.env.CENARIOS ?? 'C').split(',')
  if (wanted.includes('N')) await scenarioN()
  if (wanted.includes('A')) await scenarioA()
  if (wanted.includes('C')) await scenarioC()
  console.log(`resultado: ${JSON.stringify(outcome)}; nada ficou de pé`)
}

try {
  await main()
} catch (error) {
  console.log(`ERRO: ${error.name}; apagando as pilhas que ficaram`)
  for (const stackId of made) await removeStack(stackId).catch((e) => console.log(`  não apagou uma pilha: ${e.name}`))
  throw error
}
