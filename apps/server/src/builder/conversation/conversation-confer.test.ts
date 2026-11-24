import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import { CHECK_LIMITS } from '@conexus/app/check'
import { z } from 'zod'
import { folder, checking as versionChecking } from '../../hub/apps/test-versions.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import type { BrowserReport } from '../machine/public.ts'
import { CHECK, checking, checksIn, FAILED, turnOf, WRITE } from './test-check.ts'
import { asked, conversing, title } from './test-conversation.ts'
import { shownPartsOf, versionsOf } from './test-parts.ts'
import { tool } from './test-questions.ts'

const Image = z.looseObject({
  type: z.literal('image'),
  source: z.looseObject({ media_type: z.string() }),
})
const Messages = z.object({
  messages: z.array(z.object({ content: z.unknown() })),
})

/** The media types of the images a tool's result gave the model in one call, in order. */
function imagesRead(call: Sent | undefined): string[] {
  const { messages } = Messages.parse(call?.body)
  const results = messages.flatMap(({ content }) => (Array.isArray(content) ? content : []))
  return results.flatMap((part) =>
    (Array.isArray(part?.content) ? part.content : []).flatMap((inner: unknown) => {
      const image = Image.safeParse(inner)
      return image.success ? [image.data.source.media_type] : []
    }),
  )
}

const SHOT = 'node_modules/.conexus/tela.png'
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

/** The screen that asks `listarEncomendas` and gets a 500: the page says nothing of it, the request does. */
const DIRTY: BrowserReport = {
  kind: 'DIRTY',
  problems: [
    { kind: 'REQUEST_FAILED', method: 'POST', path: '/api/listarEncomendas', status: 500 },
  ],
  shot: SHOT,
  console: [],
}

const CLEAN: { ok: true; value: BrowserReport } = {
  ok: true,
  value: { kind: 'CLEAN', shot: SHOT, console: [] },
}

const unchecked = [
  { number: 1, changedFiles: 1, check: { state: 'unchecked', code: 'CHECK_PLATFORM_FAILED' } },
]

test('a tela que recebe 500 reprova o fim do turno com o relatório do navegador, e o modelo lê a captura como imagem (15)', async (t) => {
  const calls: Sent[] = []
  let hub: Awaited<ReturnType<typeof conversing>>['hub'] | undefined
  function answer(call: Sent): Reply {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    calls.push(call)
    const app = join(hub?.builder.folder ?? '', 'app')
    if (calls.length === 1) return { kind: 'blocks', blocks: [WRITE] }
    if (calls.length === 3) {
      mkdirSync(dirname(join(app, SHOT)), { recursive: true })
      writeFileSync(join(app, SHOT), PNG)
      return { kind: 'blocks', blocks: [tool('mastra_workspace_read_file', { path: SHOT })] }
    }
    if (calls.length === 4 && hub !== undefined) hub.builder.knobs.seeing = CLEAN
    return { kind: 'text', text: 'Pronto.' }
  }
  const subject = await conversing(t, answer)
  hub = subject.hub
  hub.builder.knobs.seeing = { ok: true, value: DIRTY }
  hub.builder.control.native = true
  checking(hub.builder.folder, [])
  const { ana, conversations } = subject
  const { events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  const [feedback] = checksIn(calls[2])
  assert.equal(feedback?.kind, 'SEEN')
  assert.deepEqual(feedback?.kind === 'SEEN' && feedback.browser, DIRTY)
  assert.ok(
    calls[2]?.texts.some((text) => text.includes('Score: 0')),
    'the judge gave it 0',
  )
  assert.deepEqual(
    imagesRead(calls[3]),
    ['image/png'],
    'the screenshot reached the model as an image',
  )
  assert.deepEqual(versionsOf(shownPartsOf(events)), [
    { number: 1, changedFiles: 1, check: { state: 'passed' } },
  ])
})

test('a conferência da máquina que falha não chega ao navegador: nenhum confer roda (16)', async (t) => {
  const model = turnOf([WRITE])
  const { hub, ana, conversations } = await conversing(t, model.answer)
  checking(
    hub.builder.folder,
    Array.from({ length: CHECK_LIMITS.checks }, () => FAILED),
  )
  const { events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  const { conferred } = hub.builder.knobs
  assert.deepEqual([conferred.opened, conferred.ended, conferred.browsed], [[], [], 0])
  assert.deepEqual(versionsOf(shownPartsOf(events)), [
    { number: 1, changedFiles: 1, check: { state: 'failed', code: 'APP_CHECK_FAILED' } },
  ])
})

test('a conferência que não pôde abrir ou ver encerra o turno unchecked, sem gastar volta, e a sessão aberta termina (16)', async (t) => {
  const cases = {
    'o ambiente não abriu': { opening: { ok: false, error: 'CONFER_PLATFORM_FAILED' }, ends: 0 },
    'o navegador não rodou': { seeing: { ok: false, error: 'CONFER_PLATFORM_FAILED' }, ends: 1 },
  } as const
  for (const [name, change] of Object.entries(cases)) {
    await t.test(name, async (t) => {
      const model = turnOf([WRITE])
      const { hub, ana, conversations } = await conversing(t, model.answer)
      Object.assign(hub.builder.knobs, change)
      checking(hub.builder.folder, [])
      const { events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
      assert.equal(model.asked.length, 2, 'the turn went back to the model for nothing')
      assert.deepEqual(versionsOf(shownPartsOf(events)), unchecked)
      assert.equal(hub.builder.knobs.conferred.ended.length, change.ends)
    })
  }
})

test('a pasta que não bate com o manifesto não empacota: unchecked, sem navegador e sem volta (16)', async (t) => {
  const model = turnOf([WRITE])
  const { hub, ana, conversations } = await conversing(t, model.answer)
  versionChecking(hub.builder.folder, ['passed'], folder({ assets: ['index.html'] }))
  const { events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  assert.equal(model.asked.length, 2)
  assert.equal(hub.builder.knobs.conferred.browsed, 0)
  assert.deepEqual(versionsOf(shownPartsOf(events)), unchecked)
  const refused = hub.lines.filter((line) => line.message === 'PREVIEW_PACK_REFUSED')
  assert.deepEqual(
    refused.map((line) => line.fields.reason),
    ['VERSION_INVALID'],
  )
})

test('um Projeto sem endereço fica com o veredito da máquina: passou, e nenhum confer roda (25)', async (t) => {
  const model = turnOf([WRITE])
  const { hub, ana, conversations } = await conversing(t, model.answer)
  hub.builder.knobs.opening = { ok: true, value: { kind: 'NO_ADDRESS' } }
  const check = checking(hub.builder.folder, [])
  const { events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  const { conferred } = hub.builder.knobs
  assert.deepEqual([conferred.opened, conferred.ended, conferred.browsed], [[], [], 0])
  assert.equal(check.calls(), 1)
  assert.deepEqual(versionsOf(shownPartsOf(events)), [
    { number: 1, changedFiles: 1, check: { state: 'passed' } },
  ])
})

test('conexus_check e o fim do turno dão o mesmo relatório do navegador, pelo mesmo Runs.check (17)', async (t) => {
  const model = turnOf([WRITE, CHECK])
  const { hub, ana, conversations } = await conversing(t, model.answer)
  hub.builder.knobs.seeing = { ok: true, value: DIRTY }
  checking(hub.builder.folder, [])
  await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  const [byTool] = checksIn(model.asked[1])
  const byEnd = checksIn(model.asked[2]).at(-1)
  assert.equal(byTool?.kind, 'SEEN')
  assert.deepEqual(byEnd, byTool)
})

test('dois conexus_check no mesmo passo rodam um depois do outro: nunca duas conferências abertas, e os dois voltam com resultado', async (t) => {
  const model = turnOf([WRITE, CHECK, CHECK])
  const { hub, ana, conversations } = await conversing(t, model.answer)
  checking(hub.builder.folder, [])
  await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  const { conferred } = hub.builder.knobs
  assert.equal(conferred.peak, 1)
  assert.ok(conferred.opened.length >= 2)
  const answers = checksIn(model.asked[1])
  assert.equal(answers.length, 2)
  assert.ok(answers.every(({ kind }) => kind === 'SEEN'))
})
