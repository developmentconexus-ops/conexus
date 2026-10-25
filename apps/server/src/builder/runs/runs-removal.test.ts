import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { BRUNO, call, codeOf, memberOn, personOn } from '../../hub/identity/test-hub.ts'
import {
  asked,
  conversing,
  holding,
  sent,
  started,
  streamOf,
  title,
} from '../conversation/test-conversation.ts'
import { failuresOf } from '../conversation/test-parts.ts'

const WRITE = 'mastra_workspace_write_file'
const OLGA = { name: 'Olga Souza', email: 'olga@example.test', role: 'admin' }

/** A model that writes `a.ts` in its first step and answers in the second. */
function writesOnce() {
  let step = 0
  return (call: Parameters<typeof title>[0]) => {
    if (title(call) !== undefined) return { kind: 'text' as const, text: 'Título' }
    step += 1
    if (step > 1) return { kind: 'text' as const, text: 'Pronto.' }
    const input = { path: 'a.ts', content: 'x\n' }
    return { kind: 'blocks' as const, blocks: [{ type: 'tool_use' as const, name: WRITE, input }] }
  }
}

function folderOf(hub: { config: { gitRoot: string } }, companyId: string, projectId: string) {
  return join(hub.config.gitRoot, companyId, `${projectId}.git`)
}

/** The conversation a test's url names. */
function idOf(url: string): string {
  return url.split('/').at(-1) ?? ''
}

async function threads(hub: Awaited<ReturnType<typeof conversing>>['hub'], id: string) {
  const found = await hub.test.mastraPool.query(
    'select count(*)::int as n from mastra.mastra_threads where id = $1',
    [id],
  )
  return found.rows[0]?.n
}

test('apagar o Projeto: a máquina da conversa morre pelo nome, cópia e repositório saem; uma falha na cópia deixa o Projeto pendente, o resto sai, e a mesma rota termina (53)', async (t) => {
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, writesOnce())
  const { url } = await asked(t, { hub, person: ana, conversations })
  assert.equal(hub.builder.bucket.held.size, 1)
  assert.equal(existsSync(folderOf(hub, companyId, projectId)), true)
  const project = `/api/companies/${companyId}/projects/${projectId}`
  hub.builder.bucket.refuse.removes = 1
  const pending = await call(hub, ana, 'DELETE', project, { name: 'Encomendas' })
  assert.deepEqual([pending.statusCode, codeOf(pending)], [503, 'PROJECT_DELETION_PENDING'])
  assert.deepEqual(hub.builder.killed, [idOf(url)])
  assert.equal(hub.builder.bucket.held.size, 1)
  assert.equal(existsSync(folderOf(hub, companyId, projectId)), false)
  assert.equal((await call(hub, ana, 'DELETE', project, { name: 'Encomendas' })).statusCode, 204)
  assert.deepEqual(
    hub.builder.killed,
    [idOf(url), idOf(url)],
    'a conversation with no machine left passes',
  )
  assert.equal(hub.builder.bucket.held.size, 0)
  assert.equal(existsSync(folderOf(hub, companyId, projectId)), false)
})

test('apagar o Projeto: as máquinas de todas as conversas morrem, também a de uma que nenhum processo segura; um kill que falha não esconde o outro, nada é apagado, e a mesma rota termina (53)', async (t) => {
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, writesOnce())
  const { url } = await asked(t, { hub, person: ana, conversations })
  const idle = await started(hub, ana, conversations)
  const both = [idOf(url), idle].sort()
  const project = `/api/companies/${companyId}/projects/${projectId}`
  hub.builder.knobs.refuseKills = 1
  const pending = await call(hub, ana, 'DELETE', project, { name: 'Encomendas' })
  assert.deepEqual([pending.statusCode, codeOf(pending)], [503, 'PROJECT_DELETION_PENDING'])
  assert.equal(hub.builder.killed.length, 1, 'the kill that failed hid not the other')
  assert.equal(await threads(hub, idOf(url)), 1, 'no thread goes while a machine may live')
  assert.equal((await call(hub, ana, 'DELETE', project, { name: 'Encomendas' })).statusCode, 204)
  assert.deepEqual([...new Set(hub.builder.killed)].sort(), both)
  assert.equal(await threads(hub, idOf(url)), 0)
})

test('tirar a pessoa: só as máquinas das conversas dela morrem (53)', async (t) => {
  const { hub, ana, companyId, conversations } = await conversing(t, writesOnce())
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  await asked(t, { hub, person: ana, conversations })
  const his = await asked(t, { hub, person: bruno, conversations })
  const member = `/api/companies/${companyId}/members/${bruno.id}`
  assert.equal((await call(hub, ana, 'DELETE', member)).statusCode, 204)
  assert.deepEqual(hub.builder.killed, [idOf(his.url)])
})

test('apagar o Projeto no meio de um turno que escreve: a execução para antes, nada é guardado', async (t) => {
  const held = holding(t)
  let step = 0
  const first = writesOnce()
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    return step === 1 ? first(call) : held.reply
  })
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Crie o app')).statusCode, 200)
  await stream.next()
  // The second call comes once the write is done, so the machine is up and seeded.
  for (let attempt = 0; attempt < 100 && step < 2; attempt += 1) {
    await new Promise((done) => setTimeout(done, 50))
  }
  const project = `/api/companies/${companyId}/projects/${projectId}`
  assert.equal((await call(hub, ana, 'DELETE', project, { name: 'Encomendas' })).statusCode, 204)
  held.release()
  await hub.close()
  const kept = await hub.test.asOwner('select count(*)::int as n from builder.conversation')
  assert.deepEqual(kept, [{ n: 0 }], 'the conversations go with the Projeto')
  assert.equal(hub.builder.bucket.held.size, 0)
  assert.equal(existsSync(folderOf(hub, companyId, projectId)), false)
  const said = hub.lines.map((line) => line.message)
  assert.equal(said.includes('RUN_SETTLING') || said.includes('VERSION_SAVED'), false)
})

test('tirar a pessoa enquanto o turno dela guarda: a execução para, e o main não anda', async (t) => {
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, writesOnce())
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  const gate = Promise.withResolvers<void>()
  t.after(() => gate.resolve())
  hub.builder.knobs.holdReceive = gate.promise
  void asked(t, { hub, person: bruno, conversations }).catch(() => undefined)
  function saving() {
    return hub.lines.some((line) => line.message === 'RUN_SETTLING')
  }
  for (let attempt = 0; attempt < 100 && !saving(); attempt += 1) {
    await new Promise((done) => setTimeout(done, 50))
  }
  assert.ok(saving(), 'the turn saves, held before its commit is checked in')
  const member = `/api/companies/${companyId}/members/${bruno.id}`
  assert.equal((await call(hub, ana, 'DELETE', member)).statusCode, 204)
  gate.resolve()
  // The save goes on past the removal's answer; it ends in a commit, or in nothing.
  const repository = hub.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
  for (let attempt = 0; attempt < 30 && (await repository.version()) === 0; attempt += 1) {
    await new Promise((done) => setTimeout(done, 100))
  }
  assert.equal(await repository.version(), 0)
})

test('tirar a pessoa no meio do turno dela: a execução dela solta o Projeto, e a próxima conversa de outra pessoa não é RUN_BUSY', async (t) => {
  const held = holding(t)
  let step = 0
  const { hub, ana, companyId, conversations } = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    return step === 1 ? held.reply : { kind: 'text', text: 'Pronto.' }
  })
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  const his = `${conversations}/${await started(hub, bruno, conversations)}`
  const stream = await streamOf(hub, bruno, his)
  t.after(() => stream.close())
  assert.equal((await sent(hub, bruno, his, 'Crie o app')).statusCode, 200)
  await stream.next()
  const member = `/api/companies/${companyId}/members/${bruno.id}`
  assert.equal((await call(hub, ana, 'DELETE', member)).statusCode, 204)
  held.release()
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(failuresOf(events), [], 'the Projeto is free')
})

test('apagar o cliente: a máquina de cada conversa morre, o repositório e a cópia de cada Projeto saem (53)', async (t) => {
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, writesOnce())
  const { url } = await asked(t, { hub, person: ana, conversations })
  const operator = await personOn(hub, OLGA)
  await hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, '00000000000001', 'Empresa Teste Ltda', $1, now())`,
    [companyId],
  )
  const body = { name: 'Empresa Teste', revision: 0 }
  assert.equal(
    (await call(hub, operator, 'DELETE', `/api/clients/${companyId}`, body)).statusCode,
    204,
  )
  assert.equal(hub.builder.bucket.held.size, 0)
  assert.equal(existsSync(folderOf(hub, companyId, projectId)), false)
  assert.deepEqual(hub.builder.killed, [idOf(url)])
})
