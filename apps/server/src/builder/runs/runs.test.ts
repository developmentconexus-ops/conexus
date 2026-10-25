import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import { post } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import {
  asked,
  conversing,
  endOf,
  holding,
  PARTIAL,
  sent,
  started,
  streamOf,
  title,
} from '../conversation/test-conversation.ts'
import { failuresOf } from '../conversation/test-parts.ts'
import { Sha } from '../git/public.ts'
import { INSTALLATION } from '../machine/test-machine.ts'

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

type Subject = Pick<Awaited<ReturnType<typeof conversing>>, 'hub' | 'companyId' | 'projectId'>

function repositoryOf({ hub, companyId, projectId }: Subject) {
  return hub.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
}

test('um turno que escreve: a versão 1 fica no main, a cópia no bucket, e o Projeto aceita a próxima mensagem', async (t) => {
  const { hub, ana, conversations, companyId, projectId } = await conversing(
    t,
    working(writing('src/a.ts', 'export const a = 1\n')),
  )
  const { events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  assert.equal(endOf(events), 'complete')
  const repository = repositoryOf({ hub, companyId, projectId })
  assert.equal(await repository.version(), 1)
  assert.equal(await repository.uncopied(), null, 'the bucket holds the version')
  const main = await repository.main()
  const files = (await repository.tree(main)) ?? []
  assert.ok(files.some((file) => file.path === 'src/a.ts' && file.bytes === 19))
  assert.ok(
    files.some((file) => file.path === 'src/main.tsx'),
    'the version stands on the starter',
  )
  assert.equal(hub.builder.bucket.held.size, 1)
  const dir = join(tmpdir(), companyId, `${projectId}.git`)
  const refs = execFileSync('git', ['--git-dir', dir, 'for-each-ref', 'refs/conexus/runs'])
  assert.equal(refs.toString(), '', "the run's own ref goes once main holds its commit")
})

test('uma mensagem enquanto a versão é guardada espera o fim e faz mais uma versão, sem misturar as duas', async (t) => {
  const turns = [writing('src/a.ts', 'um\n'), writing('src/b.ts', 'dois\n')]
  let step = 0
  const { hub, ana, conversations, companyId, projectId } = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    const tool = step % 2 === 1 ? turns[(step - 1) / 2] : undefined
    if (tool === undefined) return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: [{ type: 'tool_use', ...tool }] }
  })
  const gate = Promise.withResolvers<void>()
  t.after(() => gate.resolve())
  hub.builder.knobs.holdReceive = gate.promise
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Primeira')).statusCode, 200)
  for (let attempt = 0; attempt < 100 && !settling(); attempt += 1) {
    await new Promise((done) => setTimeout(done, 50))
  }
  function settling() {
    return hub.lines.some((line) => line.message === 'RUN_SETTLING')
  }
  assert.ok(settling(), 'the first turn saves, held before its commit is checked in')
  const second = sent(hub, ana, url, 'Segunda')
  await new Promise((done) => setTimeout(done, 300))
  assert.equal(step, 2, 'the second message calls no model while the first version is saved')
  gate.resolve()
  assert.equal((await second).statusCode, 200)
  assert.deepEqual(failuresOf(await stream.turn()), [])
  assert.deepEqual(failuresOf(await stream.turn()), [])
  const repository = repositoryOf({ hub, companyId, projectId })
  assert.equal(await repository.version(), 2)
  const dir = join(tmpdir(), companyId, `${projectId}.git`)
  function pathsAt(revision: string) {
    const listed = execFileSync('git', ['--git-dir', dir, 'ls-tree', '-r', '--name-only', revision])
    return listed
      .toString()
      .split('\n')
      .filter((path) => path.startsWith('src/'))
  }
  assert.ok(pathsAt('main~1').includes('src/a.ts'))
  assert.equal(pathsAt('main~1').includes('src/b.ts'), false, 'version 1 holds only its own turn')
  assert.ok(pathsAt('main').includes('src/b.ts') && pathsAt('main').includes('src/a.ts'))
})

test('duas conversas do mesmo Projeto, uma depois da outra: cada uma liga a sua máquina, de nome da conversa, e a segunda começa do main com a versão da primeira (52)', async (t) => {
  const turns = [writing('src/a.ts', 'um\n'), writing('src/b.ts', 'dois\n')]
  let step = 0
  const { hub, ana, conversations, companyId, projectId } = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    const tool = step % 2 === 1 ? turns[(step - 1) / 2] : undefined
    if (tool === undefined) return { kind: 'text', text: 'Pronto.' }
    return { kind: 'blocks', blocks: [{ type: 'tool_use', ...tool }] }
  })
  const first = await asked(t, { hub, person: ana, conversations }, 'Primeira')
  // The second machine is another: nothing of the first one's folder is left for it.
  rmSync(join(hub.builder.folder, 'app'), { recursive: true, force: true })
  const second = await asked(t, { hub, person: ana, conversations }, 'Segunda')
  assert.deepEqual(failuresOf([...first.events, ...second.events]), [])
  assert.deepEqual(
    hub.builder.control.names,
    [first.url, second.url].map((url) => `conexus-${INSTALLATION}-${url.split('/').at(-1)}`),
  )
  const repository = repositoryOf({ hub, companyId, projectId })
  assert.equal(await repository.version(), 2)
  const paths = ((await repository.tree(await repository.main())) ?? []).map((file) => file.path)
  assert.ok(
    paths.includes('src/a.ts') && paths.includes('src/b.ts'),
    'version 2 stands on version 1',
  )
})

test('só resposta: o turno fecha sem versão e sem tocar a máquina', async (t) => {
  const { hub, ana, conversations } = await conversing(t, (call) => ({
    kind: 'text',
    text: call.stream ? 'Só uma resposta' : 'Título',
  }))
  await asked(t, { hub, person: ana, conversations })
  assert.equal(hub.builder.bucket.held.size, 0, 'no version, no copy')
  assert.deepEqual(hub.builder.control.names, [], 'no machine started')
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
  assert.equal((await sent(hub, ana, url, 'Primeira')).statusCode, 200)
  await stream.next()
  const second = `${conversations}/${await started(hub, ana, conversations)}`
  const busy = await streamOf(hub, ana, second)
  t.after(() => busy.close())
  assert.equal((await sent(hub, ana, second, 'Outra')).statusCode, 200)
  assert.deepEqual(failuresOf(await busy.turn()), ['RUN_BUSY'])
  const projects = `/api/companies/${companyId}/projects`
  const other = await post(hub, ana, projects, { name: 'Estoque' })
  const inOther = `${projects}/${String(Object(other.json()).project.id)}/conversations`
  const elsewhere = `${inOther}/${await started(hub, ana, inOther)}`
  const beside = await streamOf(hub, ana, elsewhere)
  t.after(() => beside.close())
  assert.equal((await sent(hub, ana, elsewhere, 'Outro projeto')).statusCode, 200)
  assert.equal(await beside.text(), PARTIAL, 'the other Projeto runs')
})

test('erro depois de escrever: a versão é guardada', async (t) => {
  const first = working(writing('a.ts', 'x\n'))
  let step = 0
  const { hub, ana, conversations, companyId, projectId } = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    step += 1
    return step === 1 ? first(call) : { kind: 'refuse', status: 401 }
  })
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.equal(events.at(-1)?.type, 'agent_end')
  assert.equal(await repositoryOf({ hub, companyId, projectId }).version(), 1)
})

test('a máquina cai antes de guardar: failed, MACHINE_LOST, e o main como era', async (t) => {
  const remove = { name: COMMAND, input: { command: 'rm -rf .git' } }
  const { hub, ana, conversations, companyId, projectId } = await conversing(
    t,
    working(writing('a.ts', 'x\n'), remove),
  )
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(failuresOf(events), ['MACHINE_LOST'])
  assert.equal(hub.builder.bucket.held.size, 0)
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
  assert.equal(hub.builder.bucket.held.size, 0)
})

test('Git sumiu do disco e a cópia tem versão: o turno falha com GIT_RESTORE_NEEDED e nada recomeça na versão 1', async (t) => {
  const { hub, ana, conversations, companyId, projectId } = await conversing(
    t,
    working(writing('a.ts', 'x\n')),
  )
  hub.builder.bucket.held.set(`${companyId}/${projectId}/3`, {
    version: 3,
    sha: Sha.parse('a'.repeat(40)),
    bundle: Buffer.alloc(0),
  })
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(failuresOf(events), ['GIT_RESTORE_NEEDED'])
  const repository = hub.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
  assert.equal(await repository.head(), null)
})

test('recusa ao guardar (2.000 arquivos): o texto da recusa, o main como era', async (t) => {
  const many = {
    name: COMMAND,
    input: { command: 'mkdir -p m && cd m && seq 1 2100 | xargs touch' },
  }
  const { hub, ana, conversations, companyId, projectId } = await conversing(t, working(many))
  const { events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(failuresOf(events), ['SAVE_REFUSED'])
  assert.equal(hub.builder.bucket.held.size, 0)
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
  assert.equal(hub.builder.bucket.held.size, 0)
  assert.equal(
    await hub.builder
      .repository({ companyId: CompanyId.parse(companyId), projectId: ProjectId.parse(projectId) })
      .version(),
    0,
  )
  assert.equal(existsSync(join(hub.builder.folder, 'app')), true)
})

test('R2 fora: a versão fica guardada no servidor e a cópia pendente é repetida até o bucket aceitar', async (t) => {
  const { hub, ana, conversations, companyId, projectId } = await conversing(
    t,
    working(writing('a.ts', 'x\n')),
  )
  hub.builder.bucket.refuse.puts = 1
  await asked(t, { hub, person: ana, conversations })
  const repository = repositoryOf({ hub, companyId, projectId })
  assert.equal(await repository.uncopied(), await repository.main())
  assert.equal(hub.builder.bucket.held.size, 0)
  assert.equal(await hub.runs.retryCopies(), false)
  assert.equal(await repository.uncopied(), null)
  const mine = [...hub.builder.bucket.held.keys()].filter((key) =>
    key.startsWith(`${companyId}/${projectId}/`),
  )
  assert.equal(mine.length, 1, 'the retry reaches every Projeto on the volume, this one among them')
})
