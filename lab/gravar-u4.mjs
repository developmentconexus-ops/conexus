// A prova que grava, U4 passo 1 (cartão o-lago-da-empresa-nasce-e-some): firstmate roda, na conta
// de laboratório, com a plataforma de pé em us-east-2 e a receita publicada em lago/<sha>.json.
//
// Cópia de data/conexus-lago1-g3/gravar-u4.mjs (sha-256 be7ce272…) para rodar no servidor, por
// lab/p3-u4.sh, só com a chave do Hub: o servidor não tem administrador. Mudou só isto: a chave vem do
// perfil default de AWS_SHARED_CREDENTIALS_FILE, a conta do GetCallerIdentity (por @aws-sdk/client-sts, só do
// laboratório), os pacotes de <deps>, e o
// órfão do passo 1 é plantado antes, de fora, pelo administrador, e chega em ORFAO.
//
// Uso: ORFAO=conexus-<12> node gravar-u4.mjs <deps> <raiz do repositório> <região> <pasta de saída>
//
// O que faz, nesta ordem (cada resposta crua é gravada, com a conta, os ids e as credenciais trocados):
//  1. administrador, antes: o depósito órfão conexus-<órfão> com conexus-empresa=A e as áreas raw e current;
//  2. sessão do Hub marcada com B: GetTableBucket, ListNamespaces, DeleteNamespace, DeleteTableBucket
//     no depósito de A (as recusas);
//  3. sessão do Hub marcada com A: GetTableBucket de um depósito que nunca existiu; GetTableBucket,
//     ListNamespaces, DeleteNamespace (raw e current), DeleteTableBucket do órfão; depois de apagado,
//     GetTableBucket e DeleteTableBucket de novo;
//  4. sessão do Hub marcada com A: CreateStack do lago pela receita publicada, DescribeStacks até
//     CREATE_COMPLETE, DeleteStack, DescribeStacks até DELETE_COMPLETE, e então DeleteStack e
//     DescribeStacks pelo StackId da pilha já apagada (critério 56).
// Nada fica de pé no fim: o órfão sai no passo 3, a pilha no passo 4.
import { createHash, randomInt } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const [deps, repo, region, out] = process.argv.slice(2)
if (!deps || !repo || !region || !out) throw new Error('uso: node gravar-u4.mjs <deps> <repo> <região> <saída>')
const need = (name) => {
  const value = process.env[name]
  if (!value) throw new Error(`falta ${name}`)
  return value
}
const orphan = need('ORFAO')
if (!/^conexus-[a-z0-9]{12}$/.test(orphan)) throw new Error('ORFAO não é conexus-<12>')
const HUB_KEY_PROFILE = 'default'
const require = createRequire(join(deps, 'package.json'))
const cfn = require('@aws-sdk/client-cloudformation')
const s3t = require('@aws-sdk/client-s3tables')
// The STS that credential-providers carries; the Hub does not install @aws-sdk/client-sts.
const sts = require('@aws-sdk/nested-clients/sts')
const { fromIni, fromTemporaryCredentials } = require('@aws-sdk/credential-providers')
const { NodeHttpHandler } = require('@smithy/node-http-handler')
const SDK = require('@aws-sdk/client-cloudformation/package.json').version

const COMPANY_A = 'EmpresaTesteA0000000000000000001'
const COMPANY_B = 'EmpresaTesteB0000000000000000002'
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const lakeId = () => Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')

mkdirSync(out, { recursive: true })
const stsLab = require('@aws-sdk/client-sts')
const account = (await new stsLab.STSClient({ region, credentials: fromIni({ profile: HUB_KEY_PROFILE }) })
  .send(new stsLab.GetCallerIdentityCommand({}))).Account
const INVENTED_ACCOUNT = '111122223333'

/** Grava a última resposta crua que o handler viu, com os valores trocados (S40). */
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
    last = { status: response.statusCode, contentType: response.headers['content-type'], body: body.toString('utf8') }
    const { Readable } = await import('node:stream')
    response.body = Readable.from([body])
    return { response }
  },
}

function scrub(text) {
  return text
    .replaceAll(account, INVENTED_ACCOUNT)
    .replace(/<AccessKeyId>[^<]*</g, '<AccessKeyId>ASIAINVENTED000000001<')
    .replace(/<SecretAccessKey>[^<]*</g, '<SecretAccessKey>invented-secret<')
    .replace(/<SessionToken>[^<]*</g, '<SessionToken>invented-session-token<')
    .replace(/<RequestId>[^<]*</g, '<RequestId>00000000-0000-4000-8000-000000000000<')
    .replace(/<AssumedRoleId>[^:<]*:/g, '<AssumedRoleId>AROAINVENTED00000001:')
    .replace(/<OperationId>[^<]*</g, '<OperationId>00000000-0000-4000-8000-000000000001<')
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
    status: last.status,
    contentType: last.contentType,
    body: scrub(last.body),
  }
  writeFileSync(join(out, `${name}.json`), `${JSON.stringify(record, null, 2)}\n`)
  console.log(`${name}: ${last.status}`)
}

async function call(name, client, command, service) {
  last = undefined
  try {
    const answer = await client.send(command)
    save(name, service, command.constructor.name.replace(/Command$/, ''))
    return answer
  } catch (error) {
    if (last === undefined) throw error
    save(name, service, command.constructor.name.replace(/Command$/, ''))
    return { error: error.name }
  }
}

function hubSession(company, withAssumeRecording) {
  const params = {
    RoleArn: `arn:aws:iam::${account}:role/conexus-hub`,
    RoleSessionName: `hub-${company}`,
    Tags: [{ Key: 'conexus-empresa', Value: company }],
    DurationSeconds: 900,
  }
  return fromTemporaryCredentials({
    params,
    masterCredentials: fromIni({ profile: HUB_KEY_PROFILE }),
    clientConfig: { region, requestHandler: withAssumeRecording ? recording : handler },
  })
}

// A sessão aceita, gravada uma vez.
const stsHub = new sts.STSClient({ region, credentials: fromIni({ profile: HUB_KEY_PROFILE }), requestHandler: recording })
await call('assume-role-aceito', stsHub, new sts.AssumeRoleCommand({
  RoleArn: `arn:aws:iam::${account}:role/conexus-hub`, RoleSessionName: `hub-${COMPANY_A}`,
  Tags: [{ Key: 'conexus-empresa', Value: COMPANY_A }], DurationSeconds: 900,
}), 'sts')

const tablesA = new s3t.S3TablesClient({ region, credentials: hubSession(COMPANY_A), requestHandler: recording })
const tablesB = new s3t.S3TablesClient({ region, credentials: hubSession(COMPANY_B), requestHandler: recording })
const bucketArn = (name) => `arn:aws:s3tables:${region}:${account}:bucket/${name}`

// 1. O órfão, plantado antes pelo administrador.
const arn = bucketArn(orphan)

// 2. A sessão de B no depósito de A.
await call('get-table-bucket-outra-empresa', tablesB, new s3t.GetTableBucketCommand({ tableBucketARN: arn }), 's3tables')
await call('list-namespaces-outra-empresa', tablesB, new s3t.ListNamespacesCommand({ tableBucketARN: arn }), 's3tables')
await call('delete-namespace-outra-empresa', tablesB, new s3t.DeleteNamespaceCommand({ tableBucketARN: arn, namespace: 'raw' }), 's3tables')
await call('delete-table-bucket-outra-empresa', tablesB, new s3t.DeleteTableBucketCommand({ tableBucketARN: arn }), 's3tables')

// 3. A sessão de A.
await call('get-table-bucket-nunca-existiu', tablesA, new s3t.GetTableBucketCommand({ tableBucketARN: bucketArn(`conexus-${lakeId()}`) }), 's3tables')
await call('get-table-bucket', tablesA, new s3t.GetTableBucketCommand({ tableBucketARN: arn }), 's3tables')
await call('list-namespaces', tablesA, new s3t.ListNamespacesCommand({ tableBucketARN: arn }), 's3tables')
await call('delete-namespace', tablesA, new s3t.DeleteNamespaceCommand({ tableBucketARN: arn, namespace: 'raw' }), 's3tables')
await tablesA.send(new s3t.DeleteNamespaceCommand({ tableBucketARN: arn, namespace: 'current' }))
await call('list-namespaces-vazio', tablesA, new s3t.ListNamespacesCommand({ tableBucketARN: arn }), 's3tables')
await call('delete-table-bucket', tablesA, new s3t.DeleteTableBucketCommand({ tableBucketARN: arn }), 's3tables')
await call('get-table-bucket-apagado', tablesA, new s3t.GetTableBucketCommand({ tableBucketARN: arn }), 's3tables')
await call('delete-table-bucket-apagado', tablesA, new s3t.DeleteTableBucketCommand({ tableBucketARN: arn }), 's3tables')

// 4. A pilha de A, criada, apagada, e apagada de novo pelo id.
const template = readFileSync(join(repo, 'infra/aws/lake.template.json'))
const version = createHash('sha256').update(template).digest('hex')
const templates = `conexus-receitas-${account}-${region}`
const id = lakeId()
const stacksA = new cfn.CloudFormationClient({ region, credentials: hubSession(COMPANY_A), requestHandler: recording })
const created = await call('create-stack', stacksA, new cfn.CreateStackCommand({
  StackName: `conexus-lago-${id}`,
  ClientRequestToken: id,
  TemplateURL: `https://${templates}.s3.${region}.amazonaws.com/lago/${version}.json`,
  RoleARN: `arn:aws:iam::${account}:role/conexus-cfn`,
  OnFailure: 'DELETE',
  Capabilities: ['CAPABILITY_NAMED_IAM'],
  Parameters: [{ ParameterKey: 'LakeId', ParameterValue: id }, { ParameterKey: 'CompanyId', ParameterValue: COMPANY_A }],
  Tags: [{ Key: 'conexus-empresa', Value: COMPANY_A }, { Key: 'conexus-modelo', Value: version }],
}), 'cloudformation')
if (created.error) throw new Error(`CreateStack recusado: ${created.error}`)
const stackId = created.StackId
async function until(status, name) {
  for (;;) {
    const read = await stacksA.send(new cfn.DescribeStacksCommand({ StackName: stackId }))
    const now = read.Stacks?.[0]?.StackStatus
    if (now === status) return call(name, stacksA, new cfn.DescribeStacksCommand({ StackName: stackId }), 'cloudformation')
    if (!now?.endsWith('_IN_PROGRESS')) throw new Error(`pilha em ${now}, esperava ${status}`)
    await new Promise((resolve) => setTimeout(resolve, 3_000))
  }
}
await until('CREATE_COMPLETE', 'describe-stacks-pronta')
await call('delete-stack', stacksA, new cfn.DeleteStackCommand({ StackName: stackId }), 'cloudformation')
await until('DELETE_COMPLETE', 'describe-stacks-apagada-pelo-id')
await call('delete-stack-ja-apagada', stacksA, new cfn.DeleteStackCommand({ StackName: stackId }), 'cloudformation')
console.log('pronto; nada ficou de pé')
