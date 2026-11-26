import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyId, ConnectionId } from '@conexus/hub-api'
import { z } from 'zod'
import { awsRecording, TEST_AWS_ACCOUNT, TEST_AWS_REGION } from './test-aws.ts'
import { awsAt, TEST_LAKE_ID as LAKE, session } from './test-aws-wire.ts'

const AT = {
  company: CompanyId.parse('EmpresaTesteA0000000000000000001'),
  account: TEST_AWS_ACCOUNT,
  region: TEST_AWS_REGION,
}
const REFUSED = { kind: 'REFUSED', code: 'AccessDeniedException' }
const Sent = z.looseObject({})

function sentBody(body: string) {
  return Sent.parse(JSON.parse(body))
}

function inOrder(...names: string[]) {
  return ({ action }: { action: string }) => {
    if (action === 'AssumeRole') return session()
    const next = names.shift()
    assert.ok(next !== undefined, `no answer for ${action}`)
    return awsRecording(next)
  }
}

test('aws copia: a fila lê o lote de uma espera longa e usa a sessão do próprio Hub', async (t) => {
  const { queue, received, config } = await awsAt(
    t,
    inOrder('receive-message-lote', 'receive-message-vazio'),
  )
  const batch = await queue.receive(new AbortController().signal)
  assert.equal(batch.kind, 'DONE')
  if (batch.kind !== 'DONE') return
  const events = batch.value.map(({ body }) =>
    z.object({ detail: z.object({ startedBy: z.string() }) }).parse(JSON.parse(body)),
  )
  assert.deepEqual(
    events.map(({ detail }) => detail.startedBy),
    ['00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000b1'],
  )
  assert.ok(batch.value.every(({ handle }) => handle.length > 0))
  assert.deepEqual(await queue.receive(new AbortController().signal), { kind: 'DONE', value: [] })
  const [sent] = received.filter((r) => r.action === 'ReceiveMessage')
  assert.deepEqual(sentBody(sent?.body ?? ''), {
    QueueUrl: config.aws.copy.queueUrl,
    MaxNumberOfMessages: 10,
    WaitTimeSeconds: 20,
  })
  assert.equal(
    received.find((r) => r.action === 'AssumeRole')?.form.get('Tags.member.1.Value'),
    'copy-queue',
  )
})

test('aws copia: a espera longa passa do prazo das outras chamadas; abortada, termina sem registro', async (t) => {
  const deadlines = { connectionMs: 200, requestMs: 200, callMs: 300 }
  const slow = await awsAt(
    t,
    ({ action }) => (action === 'AssumeRole' ? session() : awsRecording('receive-message-vazio')),
    deadlines,
  )
  const late = await slow.queue.receive(new AbortController().signal)
  assert.equal(late.kind, 'DONE')
  const quiet = await awsAt(t, ({ action }) => (action === 'AssumeRole' ? session() : 'SILENT'))
  const stop = new AbortController()
  const waiting = quiet.queue.receive(stop.signal)
  setTimeout(() => stop.abort(), 100)
  assert.deepEqual(await waiting, { kind: 'NO_ANSWER' })
  assert.deepEqual(quiet.lines, [])
})

test('aws copia: confirmar uma mensagem; um recibo que não vale é recusado', async (t) => {
  const { queue, received, config } = await awsAt(
    t,
    inOrder('delete-message', 'delete-message-invalido'),
  )
  assert.deepEqual(await queue.acknowledge('recibo'), { kind: 'DONE', value: undefined })
  assert.deepEqual(await queue.acknowledge('invalido'), {
    kind: 'REFUSED',
    code: 'ReceiptHandleIsInvalid',
  })
  assert.deepEqual(sentBody(received.find((r) => r.action === 'DeleteMessage')?.body ?? ''), {
    QueueUrl: config.aws.copy.queueUrl,
    ReceiptHandle: 'recibo',
  })
})

const BUCKET = `arn:aws:s3tables:${TEST_AWS_REGION}:${TEST_AWS_ACCOUNT}:bucket/conexus-${LAKE}`

test('aws copia: listar as tabelas do lago, página por página', async (t) => {
  const { tables, received } = await awsAt(t, inOrder('list-tables-pagina', 'list-tables'))
  const listed = await tables.list(AT, LAKE)
  assert.equal(listed.kind, 'DONE')
  assert.deepEqual(listed.kind === 'DONE' ? listed.value.map(({ namespace }) => namespace) : [], [
    'raw',
    'raw',
    'current',
  ])
  const [first, second] = received.filter((r) => r.action.startsWith('GET /tables/'))
  assert.ok(first?.action.startsWith(`GET /tables/${encodeURIComponent(BUCKET)}`))
  assert.match(second?.action ?? '', /continuationToken=/)
})

test('aws copia: tabela fora das duas áreas, recusa e silêncio ao listar', async (t) => {
  const { status, body, contentType } = awsRecording('list-tables')
  const stray = { status, contentType, body: body.replace('"raw"', '"outra"') }
  const odd = await awsAt(t, ({ action }) => (action === 'AssumeRole' ? session() : stray))
  assert.deepEqual(await odd.tables.list(AT, LAKE), { kind: 'NO_ANSWER' })
  const refused = await awsAt(t, inOrder('list-tables-bucket-inexistente'))
  assert.deepEqual(await refused.tables.list(AT, LAKE), {
    kind: 'REFUSED',
    code: 'NotFoundException',
  })
})

test('aws copia: apagar uma tabela; a que a AWS não tem conta como apagada', async (t) => {
  const { tables, received } = await awsAt(
    t,
    inOrder('delete-table', 'delete-table-inexistente', 'delete-table-bucket-outra-empresa'),
  )
  const done = { kind: 'DONE', value: undefined }
  assert.deepEqual(await tables.drop(AT, LAKE, { namespace: 'raw', name: 'tabela_a' }), done)
  assert.deepEqual(await tables.drop(AT, LAKE, { namespace: 'raw', name: 'tabela_a' }), done)
  assert.deepEqual(await tables.drop(AT, LAKE, { namespace: 'current', name: 'tabela_a' }), REFUSED)
  assert.deepEqual(
    received.filter((r) => r.action.startsWith('DELETE ')).map((r) => r.action.split('?')[0]),
    [
      `DELETE /tables/${encodeURIComponent(BUCKET)}/raw/tabela_a`,
      `DELETE /tables/${encodeURIComponent(BUCKET)}/raw/tabela_a`,
      `DELETE /tables/${encodeURIComponent(BUCKET)}/current/tabela_a`,
    ],
  )
})

const CONNECTION = ConnectionId.parse('00000000-0000-4000-8000-0000000000c1')
const STATE_PATH = `/conexus-estado-${TEST_AWS_ACCOUNT}-${TEST_AWS_REGION}/${AT.company}/${CONNECTION}/copia%3Atap-conexus-to-target-conexus/state.json`
const Saved = z.object({
  completed: z.object({ singer_state: z.object({ bookmarks: z.record(z.string(), z.unknown()) }) }),
})

test('aws copia: o ponto de parada de uma tabela sai do arquivo da ligação, e o das outras fica', async (t) => {
  const { tables, received } = await awsAt(t, inOrder('get-object', 'put-object'))
  const done = { kind: 'DONE', value: undefined }
  assert.deepEqual(await tables.forget(AT, CONNECTION, 'sankhya_notas'), done)
  const [read, wrote] = received.filter((r) => r.action.includes('state.json'))
  assert.equal(read?.action, `GET ${STATE_PATH}?x-id=GetObject`)
  assert.equal(wrote?.action, `PUT ${STATE_PATH}?x-id=PutObject`)
  assert.deepEqual(
    Object.keys(Saved.parse(JSON.parse(wrote?.body ?? '')).completed.singer_state.bookmarks),
    ['efd_st_media_diaria'],
  )
})

test('aws copia: sem arquivo de estado ou sem o fluxo, esquecer não grava nada', async (t) => {
  const missing = await awsAt(t, inOrder('get-object-ausente'))
  const done = { kind: 'DONE', value: undefined }
  assert.deepEqual(await missing.tables.forget(AT, CONNECTION, 'sankhya_notas'), done)
  const other = await awsAt(t, inOrder('get-object'))
  assert.deepEqual(await other.tables.forget(AT, CONNECTION, 'sankhya_parceiros'), done)
  for (const run of [missing, other])
    assert.deepEqual(run.of(`PUT ${STATE_PATH}?x-id=PutObject`), [])
})

test('aws copia: o estado mudo não conta como esquecido', async (t) => {
  const silent = await awsAt(t, ({ action }) => (action === 'AssumeRole' ? session() : 'SILENT'), {
    connectionMs: 200,
    requestMs: 200,
    callMs: 300,
  })
  assert.deepEqual(await silent.tables.forget(AT, CONNECTION, 'sankhya_notas'), {
    kind: 'NO_ANSWER',
  })
})
