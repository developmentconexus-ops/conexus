import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ConversationId, PersonId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import type { AssistantMachineApi, KitFactory } from '../machine/public.ts'
import { INSTALLATION } from '../machine/test-machine.ts'
import { testAssistantMachines } from '../runs/test-runs.ts'
import { createAssistantMachines } from './public.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const PERSON = PersonId.parse('person-ana')

type Line = { message: string; fields: Record<string, unknown> }

/**
 * The Assistant's machines over folders of this computer, one conversation whose machine the
 * provider holds with `a.txt` in its folder; `api` and `kit` replace the doubles' where a test
 * needs to watch or break them.
 */
function machinesOf(
  t: TestContext,
  replace: { api?: Partial<AssistantMachineApi>; kit?: (kit: KitFactory) => KitFactory } = {},
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
  const machines = createAssistantMachines(
    {
      ...doubles.deps,
      api: { ...doubles.deps.api, ...replace.api },
      kit: replace.kit?.(doubles.deps.kit) ?? doubles.deps.kit,
      log,
      scopeOf: async () => ({
        companyId: COMPANY,
        personId: PERSON,
        place: { kind: 'COMPANY' },
        chosen: [],
      }),
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
