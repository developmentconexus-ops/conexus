import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ConversationId, NetworkDomain } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { createWorkspaceTools, WORKSPACE_TOOLS } from '@mastra/core/workspace'
import { until } from '../../platform/test-until.ts'
import { ALLOWED_HOSTS, createConversationMachines, MARK, PACKAGE_HOSTS } from './public.ts'
import { testConversationMachines } from './test-conversation-machines.ts'
import { INSTALLATION, pausedByE2b } from './test-machine.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const OTHER_COMPANY = CompanyId.parse('companyBBBBBBBBBBBBBBBBBBBBBBBBB')

function domains(...names: string[]) {
  return names.map((name) => NetworkDomain.parse(name))
}

function nameOf(id: ConversationId) {
  return `conexus-${INSTALLATION}-${id}`
}

function world(t: TestContext) {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-network-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  const doubles = testConversationMachines(folder)
  const company = new Map<CompanyId, NetworkDomain[]>()
  const conversation = new Map<ConversationId, NetworkDomain[]>()
  const lines: { message: string; fields: Record<string, unknown> }[] = []
  const log = {
    info: (fields: Record<string, unknown>, message: string) => lines.push({ message, fields }),
    error: (fields: Record<string, unknown>, message: string) => lines.push({ message, fields }),
  }
  async function opened(where: { companyId: CompanyId; conversationId: ConversationId }) {
    return [
      ...(company.get(where.companyId) ?? []),
      ...(conversation.get(where.conversationId) ?? []),
    ]
  }
  const onRequest = { kind: 'ON_REQUEST', hosts: PACKAGE_HOSTS, opened } as const
  function hub(network: Parameters<typeof createConversationMachines>[0]['network'] = onRequest) {
    return createConversationMachines(
      {
        network,
        otherTemplate: 'resume',
        marks: async (context) => ({ [MARK.company]: String(context.get('company')) }),
      },
      { ...doubles.deps, log },
      doubles.tuning,
    )
  }
  function appliedTo(id: ConversationId) {
    return doubles.control.networkApplied
      .filter((each) => each.name === nameOf(id))
      .map((each) => each.hosts)
  }
  return { ...doubles, company, conversation, lines, opened, onRequest, hub, appliedTo }
}

async function turn(machines: ReturnType<ReturnType<typeof world>['hub']>, companyId = COMPANY) {
  const id = ConversationId.parse(randomUUID())
  const context = new RequestContext<unknown>([
    ['controller', { sessionId: id }],
    ['company', companyId],
  ])
  const workspace = await machines.workspace(context)
  const files = workspace?.filesystem
  assert.ok(workspace !== undefined && files !== undefined)
  const held = workspace
  const written = files
  function write() {
    return written.writeFile('a.txt', 'um')
  }
  async function command() {
    const tools = await createWorkspaceTools(held)
    const execute = tools[WORKSPACE_TOOLS.SANDBOX.EXECUTE_COMMAND]
    assert.ok(execute, 'the workspace offers execute_command')
    const input = { description: 'Listando', command: 'echo feito' }
    return JSON.stringify(await execute.execute(input, { workspace: held }))
  }
  return { id, context, write, command }
}

test('a rede na partida: a máquina criada leva os registros de pacote, a lista da empresa e a da conversa, e nada mais (8)', async (t) => {
  const on = world(t)
  const asked = await turn(on.hub())
  on.company.set(COMPANY, domains('api.example.com'))
  on.company.set(OTHER_COMPANY, domains('outra.example.com'))
  on.conversation.set(asked.id, domains('*.docs.example.org'))
  await asked.write()
  assert.deepEqual(on.appliedTo(asked.id), [
    [...PACKAGE_HOSTS, 'api.example.com', '*.docs.example.org'],
  ])
})

test('a rede na partida: a máquina que volta de uma pausa leva as listas de agora (8)', async (t) => {
  const on = world(t)
  on.company.set(COMPANY, domains('antes.example.com'))
  const asked = await turn(on.hub())
  await asked.write()
  on.company.set(COMPANY, domains('depois.example.com'))
  pausedByE2b(on.control)
  await asked.command()
  assert.deepEqual(on.appliedTo(asked.id).at(-1), [...PACKAGE_HOSTS, 'depois.example.com'])
})

test('a rede na partida: depois que o Hub reinicia, a máquina achada leva as listas de agora (8)', async (t) => {
  const on = world(t)
  on.company.set(COMPANY, domains('antes.example.com'))
  const before = await turn(on.hub())
  await before.write()
  on.control.discoverable.push(nameOf(before.id))
  on.company.set(COMPANY, domains('depois.example.com'))
  const files = (await on.hub().workspace(before.context))?.filesystem
  await files?.writeFile('b.txt', 'dois')
  assert.deepEqual(on.control.attached, [nameOf(before.id)])
  assert.deepEqual(on.appliedTo(before.id).at(-1), [...PACKAGE_HOSTS, 'depois.example.com'])
})

test('a rede na partida: o download, sem conversa em curso, liga a máquina achada só com os registros de pacote (8)', async (t) => {
  const on = world(t)
  on.company.set(COMPANY, domains('api.example.com'))
  const id = ConversationId.parse(randomUUID())
  on.control.discoverable.push(nameOf(id))
  mkdirSync(on.tuning.workFolder, { recursive: true })
  writeFileSync(join(on.tuning.workFolder, 'a.txt'), 'um')
  const machines = on.hub({
    ...on.onRequest,
    opened: async () => assert.fail('a download has no company whose lists to read'),
  })
  const read = await machines.read(id, 'a.txt', new AbortController().signal)
  assert.equal(read.kind, 'OK')
  assert.deepEqual(on.appliedTo(id), [PACKAGE_HOSTS])
})

test('os construtores não seguem a lista: a máquina de lista fixa leva os próprios endereços, com a empresa tendo domínios (9)', async (t) => {
  const on = world(t)
  on.company.set(COMPANY, domains('api.example.com'))
  const built = await turn(on.hub({ kind: 'FIXED', hosts: ALLOWED_HOSTS }))
  await built.write()
  assert.deepEqual(on.appliedTo(built.id), [['registry.npmjs.org']])
})

test('a remoção fecha as máquinas ligadas da empresa, e só elas (10)', async (t) => {
  const on = world(t)
  const machines = on.hub()
  on.company.set(COMPANY, domains('api.example.com'))
  on.company.set(OTHER_COMPANY, domains('api.example.com'))
  const first = await turn(machines)
  const second = await turn(machines)
  const other = await turn(machines, OTHER_COMPANY)
  const unused = await turn(machines)
  for (const each of [first, second, other]) await each.write()
  on.conversation.set(second.id, domains('da-conversa.example.com'))
  on.company.set(COMPANY, [])
  await machines.narrow(COMPANY)
  assert.deepEqual(on.appliedTo(first.id).slice(1), [PACKAGE_HOSTS])
  assert.deepEqual(on.appliedTo(second.id).slice(1), [
    [...PACKAGE_HOSTS, 'da-conversa.example.com'],
  ])
  assert.equal(on.appliedTo(other.id).length, 1, 'another company keeps its list')
  assert.deepEqual(on.appliedTo(unused.id), [], 'a machine never started takes no change')
  assert.equal(on.control.names.includes(nameOf(unused.id)), false)
})

test('a troca que falha refaz na próxima ferramenta, antes de o comando rodar, e a falha vai ao log sem o domínio (10)', async (t) => {
  const on = world(t)
  const machines = on.hub()
  on.company.set(COMPANY, domains('api.example.com'))
  const asked = await turn(machines)
  await asked.write()
  on.company.set(COMPANY, [])
  on.control.openFails = 100
  await machines.narrow(COMPANY)
  assert.deepEqual(on.lines.slice(1), [
    { message: 'MACHINE_NETWORK_FAILED', fields: { conversationId: asked.id, reason: 'REMOVE' } },
  ])
  const during: unknown[] = []
  on.control.afterCommand = () => during.push(on.appliedTo(asked.id).at(-1))
  assert.match(await asked.command(), /feito/, 'a retry that fails holds no tool back')
  assert.deepEqual(during.at(-1), [...PACKAGE_HOSTS, 'api.example.com'])
  on.control.openFails = 0
  await asked.command()
  assert.deepEqual(during.at(-1), PACKAGE_HOSTS)
  const sent = on.appliedTo(asked.id).length
  await asked.command()
  assert.equal(on.appliedTo(asked.id).length, sent, 'a change that took effect is not made again')
})

test('a liberação chega à máquina ligada, e reopen diz false quando a troca falha (10)', async (t) => {
  const on = world(t)
  const machines = on.hub()
  const asked = await turn(machines)
  await asked.write()
  on.conversation.set(asked.id, domains('api.example.com'))
  on.control.openFails = 1
  assert.equal(await machines.reopen(asked.id), false)
  assert.equal(on.lines.at(-1)?.fields.reason, 'GRANT')
  assert.equal(await machines.reopen(asked.id), true)
  assert.deepEqual(on.appliedTo(asked.id).at(-1), [...PACKAGE_HOSTS, 'api.example.com'])
  assert.equal(await machines.reopen(ConversationId.parse(randomUUID())), true)
})

test('a remoção que chega durante a partida entra depois dela, e a máquina fica com as listas de agora (10, C65)', async (t) => {
  const on = world(t)
  const gate = Promise.withResolvers<void>()
  let reads = 0
  const machines = on.hub({
    ...on.onRequest,
    opened: async (where) => {
      const read = await on.opened(where)
      reads += 1
      if (reads === 1) await gate.promise
      return read
    },
  })
  on.company.set(COMPANY, domains('api.example.com'))
  const asked = await turn(machines)
  const writing = asked.write()
  await until(() => reads === 1, 'the start read the lists')
  on.company.set(COMPANY, [])
  const narrowing = machines.narrow(COMPANY)
  await new Promise((later) => setTimeout(later, 50))
  gate.resolve()
  await Promise.all([writing, narrowing])
  assert.deepEqual(on.appliedTo(asked.id).at(-1), PACKAGE_HOSTS)
})

test('a partida sem a rede certa falha: a máquina não é entregue, o turno vê MACHINE_UNAVAILABLE, e a seguinte parte (11)', async (t) => {
  const on = world(t)
  on.company.set(COMPANY, domains('api.example.com'))
  on.control.openFails = 1
  let commands = 0
  on.control.afterCommand = () => {
    commands += 1
  }
  const asked = await turn(on.hub())
  await assert.rejects(asked.write(), { code: 'MACHINE_UNAVAILABLE' })
  assert.equal(commands, 0, 'nothing ran on the machine')
  assert.deepEqual(
    on.lines.map((each) => [each.message, each.fields.reason]),
    [
      ['MACHINE_NETWORK_FAILED', 'START'],
      ['MACHINE_UNAVAILABLE', 'NETWORK'],
    ],
  )
  assert.equal(JSON.stringify(on.lines).includes('example.com'), false)
  await asked.write()
  assert.deepEqual(on.appliedTo(asked.id), [[...PACKAGE_HOSTS, 'api.example.com']])
})

test('a partida sem a rede certa falha também quando as listas não são lidas (11)', async (t) => {
  const on = world(t)
  const asked = await turn(
    on.hub({
      ...on.onRequest,
      opened: async () => {
        throw new Error('connection refused')
      },
    }),
  )
  await assert.rejects(asked.write(), { code: 'MACHINE_UNAVAILABLE' })
  assert.deepEqual(on.appliedTo(asked.id), [])
  assert.equal(on.lines.at(-1)?.fields.reason, 'NETWORK')
})
