import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, truncateSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ConversationId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { WORKSPACE_TOOLS } from '@mastra/core/workspace'
import { MAX_BYTES } from '../git/public.ts'
import { testAssistantMachines } from '../runs/test-runs.ts'
import type { ConversationMachineApi, KitFactory } from './public.ts'
import { createConversationMachines, MARK, PACKAGE_HOSTS } from './public.ts'
import { INSTALLATION, OLD_TEMPLATE } from './test-machine.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')

type Line = { message: string; fields: Record<string, unknown> }

/**
 * The Assistant's machines over folders of this computer, one conversation whose machine the
 * provider holds with `a.txt` in its folder; `api` and `kit` replace the doubles' where a test
 * needs to watch or break them.
 */
function machinesOf(
  t: TestContext,
  replace: { api?: Partial<ConversationMachineApi>; kit?: (kit: KitFactory) => KitFactory } = {},
  tuning: { startMs?: number } = {},
) {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-lane-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  const doubles = testAssistantMachines(folder)
  const lines: Line[] = []
  const log = {
    info: (fields: Record<string, unknown>, message: string) => lines.push({ message, fields }),
    error: (fields: Record<string, unknown>, message: string) => lines.push({ message, fields }),
  }
  const id = ConversationId.parse(randomUUID())
  mkdirSync(doubles.tuning.workFolder, { recursive: true })
  writeFileSync(join(doubles.tuning.workFolder, 'a.txt'), 'um')
  doubles.control.discoverable.push(`conexus-${INSTALLATION}-${id}`)
  const machines = createConversationMachines(
    {
      ...doubles.deps,
      api: { ...doubles.deps.api, ...replace.api },
      kit: replace.kit?.(doubles.deps.kit) ?? doubles.deps.kit,
      log,
      hosts: PACKAGE_HOSTS,
      marksOf: async () => ({ [MARK.company]: COMPANY }),
    },
    { ...doubles.tuning, ...tuning },
  )
  return { ...doubles, machines, id, lines }
}

function kept() {
  return new AbortController().signal
}

/** The machines with each start recorded by how many pauses had ended when it began. */
function watchingStarts(t: TestContext) {
  const startedAfter: number[] = []
  const on = machinesOf(t, {
    kit: (kit) => (options) => {
      const made = kit(options)
      const start = made.sandbox.start?.bind(made.sandbox)
      made.sandbox.start = async () => {
        startedAfter.push(on.control.stops)
        await start?.()
      }
      return made
    },
  })
  return { ...on, startedAfter }
}

/** A turn of the conversation whose machine started: its workspace wrote a file. */
async function turnOf(on: ReturnType<typeof machinesOf>) {
  const context = new RequestContext<unknown>([['controller', { sessionId: on.id }]])
  const files = (await on.machines.workspace(context))?.filesystem
  assert.ok(files !== undefined)
  await files.writeFile('b.txt', 'dois')
  return context
}

test('a fila da conversa: dois downloads ao mesmo tempo ligam a máquina um depois do outro, e o segundo só a liga depois que a pausa do primeiro acabou (B2, C65)', async (t) => {
  const on = watchingStarts(t)
  on.control.stopMs = 100
  const [first, second] = await Promise.all([
    on.machines.read(on.id, 'a.txt', kept()),
    on.machines.read(on.id, 'a.txt', kept()),
  ])
  assert.deepEqual([first.kind, second.kind], ['OK', 'OK'])
  assert.deepEqual(on.startedAfter, [0, 1], 'the second start waited for the first pause')
  assert.equal(on.control.stops, 2)
})

test('a máquina achada e perdida antes de ligar: a religação pelo id se recusa a fazer outra, e o download responde FILE_GONE (B2)', async (t) => {
  const on = machinesOf(t, { api: { find: async () => 'conexus-maquina-perdida' } })
  const read = await on.machines.read(on.id, 'a.txt', kept())
  assert.equal(read.kind, 'FILE_GONE')
  assert.deepEqual(on.control.names, [], 'no machine was made in its place')
  assert.deepEqual(on.killed, [], 'and none was killed')
})

test('a partida que passa do prazo: o download responde MACHINE_UNAVAILABLE, e a máquina que liga depois é pausada (F26)', async (t) => {
  const on = machinesOf(t, {}, { startMs: 100 })
  on.control.upMs = 400
  const read = await on.machines.read(on.id, 'a.txt', kept())
  assert.equal(read.kind, 'MACHINE_UNAVAILABLE')
  assert.equal(on.control.stops, 1, 'the late start was paused, not left running')
  const line = on.lines.find((each) => each.message === 'MACHINE_UNAVAILABLE')
  assert.equal(line?.fields.reason, 'START')
})

test('o fim do Hub com uma pausa que falha: stopAll termina, e a falha fica no log com a conversa (F18)', async (t) => {
  const on = machinesOf(t)
  const context = new RequestContext<unknown>([['controller', { sessionId: on.id }]])
  const files = (await on.machines.workspace(context))?.filesystem
  assert.ok(files !== undefined)
  await files.writeFile('b.txt', 'dois')
  on.control.killed = true
  await on.machines.stopAll()
  const line = on.lines.find((each) => each.message === 'MACHINE_UNAVAILABLE')
  assert.equal(line?.fields.reason, 'STOP')
  assert.equal(line?.fields.conversationId, on.id)
})

test('a fila da conversa: o download que chega logo depois do fim do turno espera a pausa lenta acabar para ligar a máquina (F-D, C65)', async (t) => {
  const on = watchingStarts(t)
  await turnOf(on)
  on.control.stopMs = 200
  const stopping = on.machines.stop(on.id)
  const read = await on.machines.read(on.id, 'a.txt', kept())
  await stopping
  assert.equal(read.kind, 'OK')
  assert.deepEqual(on.startedAfter, [0, 1], 'the download started after the pause ended')
})

test('a fila da conversa: o turno seguinte que abre a máquina logo depois do fim do anterior espera a pausa lenta acabar (F-D, C65)', async (t) => {
  const on = watchingStarts(t)
  const context = await turnOf(on)
  on.control.stopMs = 200
  const stopping = on.machines.stop(on.id)
  const files = (await on.machines.workspace(context))?.filesystem
  assert.ok(files !== undefined)
  await files.writeFile('c.txt', 'três')
  await stopping
  assert.deepEqual(on.startedAfter, [0, 1], 'the next turn started after the pause ended')
})

test('a rede só fecha na máquina achada; a pasta que o mkdir não fez derruba a partida; o link para fora da pasta não é entregue (S)', async (t) => {
  const connected = machinesOf(t)
  await turnOf(connected)
  assert.equal(connected.control.networkClosed, 1)
  const created = machinesOf(t)
  created.control.discoverable.length = 0
  await turnOf(created)
  assert.equal(created.control.networkClosed, 0)
  for (const executeCommand of [
    undefined,
    async () => ({ exitCode: 1, stdout: '', stderr: '', success: false, executionTimeMs: 0 }),
  ]) {
    const on = machinesOf(t, {
      kit: (kit) => (options) =>
        Object.assign(kit(options), {
          sandbox: Object.assign(kit(options).sandbox, { executeCommand }),
        }),
    })
    assert.equal((await on.machines.read(on.id, 'a.txt', kept())).kind, 'MACHINE_UNAVAILABLE')
  }
  const on = machinesOf(t)
  on.control.native = true
  const outside = join(on.tuning.workFolder, '..', 'segredo.txt')
  writeFileSync(outside, 'SECRET OUTSIDE')
  symlinkSync(outside, join(on.tuning.workFolder, 'link.txt'))
  assert.equal((await on.machines.read(on.id, 'link.txt', kept())).kind, 'FILE_NOT_FOUND')
})

test('o workspace do modelo tem a edição por AST desligada (S)', async (t) => {
  const on = machinesOf(t)
  const context = new RequestContext<unknown>([['controller', { sessionId: on.id }]])
  const workspace = await on.machines.workspace(context)
  // The tool exists only where @ast-grep/napi is installed, which no package of Conexus carries
  // today: the switch is what keeps it off the day one does.
  assert.equal(workspace?.getToolsConfig()?.[WORKSPACE_TOOLS.FILESYSTEM.AST_EDIT]?.enabled, false)
})

test('a máquina do turno: serving só existe com sessão, o download lê a máquina do turno, kill apaga a sessão, e o ouvinte da fase recebe starting até ser cancelado (S)', async (t) => {
  const on = machinesOf(t)
  const context = new RequestContext<unknown>([['controller', { sessionId: on.id }]])
  assert.equal(on.machines.serving(context), undefined)
  const phases: string[] = []
  on.machines.onPhase(on.id, (phase) => phases.push(phase))
  await turnOf(on)
  assert.deepEqual(phases, ['starting'])
  assert.notEqual(on.machines.serving(context), undefined)
  assert.equal((await on.machines.read(on.id, 'b.txt', kept())).kind, 'OK')
  assert.equal(on.control.names.length, 1, 'the download used the turn’s machine')
  await on.machines.kill(on.id)
  assert.equal(on.machines.serving(context), undefined)
})

test('o fim do turno: stop pausa só a máquina que ligou, e stopAll para todas as conversas (S)', async (t) => {
  const idle = machinesOf(t)
  await idle.machines.workspace(
    new RequestContext<unknown>([['controller', { sessionId: idle.id }]]),
  )
  await idle.machines.stop(idle.id)
  assert.equal(idle.control.stops, 0, 'no machine was started')
  const broken = machinesOf(t)
  broken.control.start = 'unreachable'
  const files = (
    await broken.machines.workspace(
      new RequestContext<unknown>([['controller', { sessionId: broken.id }]]),
    )
  )?.filesystem
  await assert.rejects(async () => files?.writeFile('b.txt', 'x'))
  await broken.machines.stop(broken.id)
  assert.equal(broken.control.stops, 0, 'a start that failed made nothing to pause')
  const many = machinesOf(t)
  await turnOf(many)
  const other = ConversationId.parse(randomUUID())
  many.control.discoverable.push(`conexus-${INSTALLATION}-${other}`)
  const second = new RequestContext<unknown>([['controller', { sessionId: other }]])
  await (await many.machines.workspace(second))?.filesystem?.writeFile('c.txt', 'x')
  await many.machines.stopAll()
  assert.equal(many.control.stops, 2)
})

test('o download achado pelo id religa pelo id e não mata a de outro modelo; o limite é MAX_BYTES (S)', async (t) => {
  const on = machinesOf(t)
  on.control.discoverable.push(`conexus-${INSTALLATION}-old-${on.id}`)
  on.control.templates[`conexus-${INSTALLATION}-old-${on.id}`] = OLD_TEMPLATE
  for (const [name, size] of [
    ['exato.bin', MAX_BYTES],
    ['passou.bin', MAX_BYTES + 1],
  ] as const) {
    writeFileSync(join(on.tuning.workFolder, name), '')
    truncateSync(join(on.tuning.workFolder, name), size)
  }
  mkdirSync(join(on.tuning.workFolder, 'pasta'))
  assert.equal((await on.machines.read(on.id, 'exato.bin', kept())).kind, 'OK')
  assert.equal((await on.machines.read(on.id, 'passou.bin', kept())).kind, 'FILE_TOO_LARGE')
  assert.equal((await on.machines.read(on.id, 'pasta', kept())).kind, 'FILE_NOT_FOUND')
  assert.deepEqual(
    on.control.attached.map((name) => name.endsWith(on.id)),
    [true, true, true],
  )
  assert.deepEqual(on.control.replaced, [], 'a download never kills')
})

test('o ouvinte da fase cancelado não ouve a partida seguinte (S)', async (t) => {
  const on = machinesOf(t)
  const phases: string[] = []
  const unlisten = on.machines.onPhase(on.id, (phase) => phases.push(phase))
  unlisten()
  await turnOf(on)
  assert.deepEqual(phases, [])
})
