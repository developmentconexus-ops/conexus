import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { post } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import {
  asked,
  conversing,
  failuresOf,
  holding,
  sent,
  started,
  streamOf,
  title,
} from '../conversation/test-conversation.ts'
import { SandboxId } from '../machine/public.ts'

const WRITE = 'mastra_workspace_write_file'
const COMMAND = 'mastra_workspace_execute_command'

type Tool = { name: string; input: object }

/** A model that calls `tools` in its first step and answers in the second. */
function working(...tools: Tool[]): (call: Sent) => Reply {
  let step = 0
  return (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    if (step > 1) return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: tools.map((tool) => ({ type: 'tool_use', ...tool })) }
  }
}

function writing(path: string, content: string): Tool {
  return { name: WRITE, input: { path, content } }
}

async function runs(hub: Awaited<ReturnType<typeof conversing>>['hub']) {
  return hub.test.asOwner(
    `select state, base_sha, candidate_sha, copied_at is not null as copied, deadline_at from builder.run order by deadline_at`,
  )
}

test('um turno que escreve: a versão 1 fica no main, a cópia no bucket, e o Projeto aceita a próxima mensagem', async (t) => {
  const { hub, ana, conversations, companyId, projectId } = await conversing(
    t,
    working(writing('src/a.ts', 'export const a = 1\n')),
  )
  const { events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  const [saved] = await runs(hub)
  assert.equal(saved?.state, 'saved')
  assert.equal(saved?.copied, true)
  const repository = hub.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
  assert.equal(await repository.version(), 1)
  const main = await repository.main()
  assert.deepEqual(await repository.tree(main), [{ path: 'src/a.ts', bytes: 19 }])
  assert.equal(hub.builder.bucket.held.size, 1)
})

test('só resposta: o turno fecha sem versão e sem tocar a máquina', async (t) => {
  const { hub, ana, conversations } = await conversing(t, (call) => ({
    kind: 'text',
    text: call.stream ? 'Só uma resposta' : 'Título',
  }))
  await asked(t, { hub, person: ana, conversations })
  const [only] = await runs(hub)
  assert.equal(only?.state, 'unchanged')
  assert.equal(only?.base_sha, null)
  assert.deepEqual(await hub.test.asOwner('select * from builder.machine'), [])
  assert.equal(existsSync(join(hub.builder.folder, 'app')), false)
})

test('execução aberta: a mensagem de outro no Projeto é RUN_BUSY; em outro Projeto passa', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations, companyId } = await conversing(
    t,
    (call) => title(call) ?? held.reply,
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Primeira')).statusCode, 202)
  await stream.said()
  const second = `${conversations}/${await started(hub, ana, conversations)}`
  assert.equal((await sent(hub, ana, second, 'Outra')).statusCode, 409)
  const made = await hub.test.asOwner(`select 1 from builder.run where state = 'open'`)
  assert.equal(made.length, 1)
  const projects = `/api/companies/${companyId}/projects`
  const other = await post(hub, ana, projects, { name: 'Estoque' })
  const inOther = `${projects}/${String(Object(other.json()).project.id)}/conversations`
  const elsewhere = `${inOther}/${await started(hub, ana, inOther)}`
  assert.equal((await sent(hub, ana, elsewhere, 'Outro projeto')).statusCode, 202)
})

test('além da hora: o turno para, o que foi escrito é guardado e a máquina leva o prazo do turno', async (t) => {
  const hang = new Promise<void>(() => undefined)
  const first = working(writing('src/a.ts', 'um\n'))
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    return step === 1 ? first(call) : { kind: 'hold', until: hang, text: 'Pensando' }
  })
  hub.builder.knobs.turnMs = 1_500
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'aborted' })
  const [saved] = await runs(hub)
  assert.equal(saved?.state, 'saved')
  const deadline = saved?.deadline_at
  assert.ok(deadline instanceof Date)
  assert.deepEqual(
    hub.builder.control.deadlines.map((at) => at.getTime()),
    [deadline.getTime()],
  )
})

test('erro depois de escrever: a versão é guardada', async (t) => {
  const first = working(writing('a.ts', 'x\n'))
  let step = 0
  const { hub, ana, conversations } = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    return step === 1 ? first(call) : { kind: 'refuse', status: 401 }
  })
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.equal(events.at(-1)?.type, 'turnEnd')
  assert.equal((await runs(hub))[0]?.state, 'saved')
})

test('a máquina cai antes de guardar: failed, MACHINE_LOST, e o main como era', async (t) => {
  const remove = { name: COMMAND, input: { command: 'rm -rf app/.git' } }
  const { hub, ana, conversations, companyId, projectId } = await conversing(
    t,
    working(writing('a.ts', 'x\n'), remove),
  )
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(failuresOf(events), ['MACHINE_LOST'])
  assert.equal((await runs(hub))[0]?.state, 'failed')
  assert.equal(
    await hub.builder
      .repository({ companyId: CompanyId.parse(companyId), projectId: ProjectId.parse(projectId) })
      .version(),
    0,
  )
})

test('a máquina não liga na primeira ferramenta: o aviso de que não ligou, não o de que caiu; nada é guardado', async (t) => {
  const { hub, ana, conversations } = await conversing(t, working(writing('a.ts', 'x\n')))
  hub.builder.control.start = 'unreachable'
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(failuresOf(events), ['MACHINE_UNAVAILABLE'])
  assert.equal((await runs(hub))[0]?.state, 'failed')
})

test('recusa ao guardar (2.000 arquivos): o texto da recusa, o main como era', async (t) => {
  const many = {
    name: COMMAND,
    input: { command: 'mkdir -p app/m && cd app/m && seq 1 2100 | xargs touch' },
  }
  const { hub, ana, conversations, companyId, projectId } = await conversing(t, working(many))
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(failuresOf(events), ['SAVE_REFUSED'])
  assert.equal((await runs(hub))[0]?.state, 'failed')
  const repository = hub.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
  assert.equal(await repository.version(), 0)
})

test('nada mudado: sem versão; o comando tocou a máquina, o turno fecha unchanged', async (t) => {
  const { hub, ana, conversations, companyId, projectId } = await conversing(
    t,
    working({ name: COMMAND, input: { command: 'echo oi' } }),
  )
  await asked(t, { hub, person: ana, conversations })
  assert.equal((await runs(hub))[0]?.state, 'unchanged')
  assert.equal(
    await hub.builder
      .repository({ companyId: CompanyId.parse(companyId), projectId: ProjectId.parse(projectId) })
      .version(),
    0,
  )
  assert.equal(existsSync(join(hub.builder.folder, 'app')), true)
})

test('R2 fora: a versão fica guardada no servidor e a cópia pendente é repetida até o bucket aceitar', async (t) => {
  const { hub, ana, conversations } = await conversing(t, working(writing('a.ts', 'x\n')))
  hub.builder.bucket.refuse.puts = 1
  await asked(t, { hub, person: ana, conversations })
  assert.equal((await runs(hub))[0]?.copied, false)
  assert.equal(hub.builder.bucket.held.size, 0)
  assert.equal(await hub.runs.retryCopies(), false)
  assert.equal((await runs(hub))[0]?.copied, true)
  assert.equal(hub.builder.bucket.held.size, 1)
})

test('reinício entre a candidata e o avanço: uma versão; sem candidata: interrupted', async (t) => {
  const { hub, ana, conversations, companyId, projectId } = await conversing(
    t,
    working(writing('a.ts', 'x\n')),
  )
  hub.builder.knobs.dies.advance = 1
  await asked(t, { hub, person: ana, conversations })
  const repository = hub.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
  assert.equal((await runs(hub))[0]?.state, 'saving')
  assert.equal(await repository.version(), 0)
  await hub.test.asOwner(`update builder.run set lease_until = now() - interval '1 second'`)
  await hub.close()
  await hub.runs.settleRuns()
  assert.equal((await runs(hub))[0]?.state, 'saved')
  assert.equal(await repository.version(), 1)
  assert.equal(hub.builder.bucket.held.size, 1)
})

test('o processo morre antes da candidata: a execução é interrupted e o main fica como era', async (t) => {
  const { hub, ana, conversations, companyId, projectId } = await conversing(
    t,
    working(writing('a.ts', 'x\n')),
  )
  hub.builder.knobs.dies.receive = 1
  await asked(t, { hub, person: ana, conversations })
  await hub.test.asOwner(`update builder.run set lease_until = now() - interval '1 second'`)
  await hub.close()
  await hub.runs.settleRuns()
  assert.equal((await runs(hub))[0]?.state, 'interrupted')
  assert.equal(
    await hub.builder
      .repository({ companyId: CompanyId.parse(companyId), projectId: ProjectId.parse(projectId) })
      .version(),
    0,
  )
})

test('a varredura: só a máquina marcada, parada há 7 dias e sem execução aberta é morta', async (t) => {
  const held = holding(t)
  let step = 0
  const first = working(writing('a.ts', 'x\n'))
  const { hub, ana, companyId, projectId, conversations } = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    return step === 1 ? first(call) : step === 2 ? { kind: 'text', text: 'Pronto.' } : held.reply
  })
  await asked(t, { hub, person: ana, conversations })
  const [machine] = await hub.test.asOwner('select sandbox_id from builder.machine')
  const id = String(machine?.sandbox_id)
  hub.builder.listed.push(
    {
      id: SandboxId.parse(id),
      companyId: CompanyId.parse(companyId),
      projectId: ProjectId.parse(projectId),
    },
    {
      id: SandboxId.parse('stranger'),
      companyId: CompanyId.parse(companyId),
      projectId: ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA'),
    },
  )
  assert.equal(await hub.runs.sweep(), 0)
  await hub.test.asOwner(`update builder.machine set used_at = now() - interval '8 days'`)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Outra')).statusCode, 202)
  await stream.said()
  assert.equal(await hub.runs.sweep(), 0)
  held.release()
  await stream.turn()
  assert.equal(await hub.runs.sweep(), 1)
  assert.deepEqual(hub.builder.killed, [id])
  assert.deepEqual(await hub.test.asOwner('select * from builder.machine'), [])
})
