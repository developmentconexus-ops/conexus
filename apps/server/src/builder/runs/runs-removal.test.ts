import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { call, codeOf, personOn } from '../../hub/identity/test-hub.ts'
import {
  asked,
  conversing,
  holding,
  sent,
  started,
  streamOf,
  title,
} from '../conversation/test-conversation.ts'

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

test('apagar o Projeto: máquina, cópia, repositório e linhas saem; uma falha na cópia deixa o Projeto pendente, o resto sai, e a mesma rota termina', async (t) => {
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, writesOnce())
  await asked(t, { hub, person: ana, conversations })
  const machines = await hub.test.asOwner('select sandbox_id from builder.machine')
  assert.equal(machines.length, 1)
  assert.equal(hub.builder.bucket.held.size, 1)
  assert.equal(existsSync(folderOf(hub, companyId, projectId)), true)
  const project = `/api/companies/${companyId}/projects/${projectId}`
  hub.builder.bucket.refuse.removes = 1
  const pending = await call(hub, ana, 'DELETE', project, { name: 'Encomendas' })
  assert.deepEqual([pending.statusCode, codeOf(pending)], [503, 'PROJECT_DELETION_PENDING'])
  assert.equal(hub.builder.killed.length, 1)
  assert.equal(hub.builder.bucket.held.size, 1)
  assert.equal(existsSync(folderOf(hub, companyId, projectId)), false)
  assert.equal((await call(hub, ana, 'DELETE', project, { name: 'Encomendas' })).statusCode, 204)
  assert.equal(hub.builder.bucket.held.size, 0)
  assert.equal(existsSync(folderOf(hub, companyId, projectId)), false)
  for (const table of ['run', 'machine']) {
    const rows = await hub.test.asOwner(`select count(*)::int as n from builder.${table}`)
    assert.deepEqual(rows, [{ n: 0 }], table)
  }
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
  assert.equal((await sent(hub, ana, url, 'Crie o app')).statusCode, 202)
  await stream.said()
  const project = `/api/companies/${companyId}/projects/${projectId}`
  assert.equal((await call(hub, ana, 'DELETE', project, { name: 'Encomendas' })).statusCode, 204)
  held.release()
  await hub.close()
  assert.equal(hub.builder.bucket.held.size, 0)
  assert.equal(existsSync(folderOf(hub, companyId, projectId)), false)
  const said = hub.lines.map((line) => line.message)
  assert.equal(said.includes('RUN_SETTLING') || said.includes('VERSION_SAVED'), false)
})

test('apagar o cliente: o repositório e a cópia de cada Projeto saem', async (t) => {
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, writesOnce())
  await asked(t, { hub, person: ana, conversations })
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
})
