import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CHECK_LIMITS } from '@conexus/app/check'
import type { Checked } from '../../hub/apps/test-versions.ts'
import {
  checking,
  companyForVersions,
  folder,
  listed,
  plantVersion,
  send,
} from '../../hub/apps/test-versions.ts'
import { BRUNO, call, memberOn } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { title } from '../conversation/test-conversation.ts'
import { partsOf } from '../conversation/test-parts.ts'
import { previewing, turn, versionsOf } from '../conversation/test-preview.ts'

// The end of a turn sends the version whose app built to the Projeto's one app (step 14.1, U1).

test('a versão que montou vai ao ar: pronta, no ar, enviada pela pessoa do turno (1)', async (t) => {
  const subject = await previewing(t)
  const { previews } = await turn(t, subject)
  assert.deepEqual(previews, [{ state: 'ready', number: 1 }])
  assert.deepEqual(await versionsOf(subject), [
    { number: 1, state: 'ready', live: true, failure: null, sentBy: subject.ana.id },
  ])
  assert.equal(subject.hub.cloudflare.workers().length, 1)
})

const PLANNED = [
  { content: 'Tela de encomendas', activeForm: 'Fazendo a tela', status: 'in_progress' },
]
const TASKS = { type: 'tool_use', name: 'task_write', input: { tasks: PLANNED } } as const
const WRITE = {
  type: 'tool_use',
  name: 'mastra_workspace_write_file',
  input: { path: 'a.ts', content: 'x\n' },
} as const

/** A model that opens a task and writes, and then only answers: the version is saved half done. */
function leavingOpen() {
  const asked: Sent[] = []
  return (callOf: Sent): Reply => {
    if (title(callOf) !== undefined) return { kind: 'text', text: 'Título' }
    asked.push(callOf)
    if (asked.length === 1) return { kind: 'blocks', blocks: [TASKS, WRITE] }
    return { kind: 'text', text: 'Pronto.' }
  }
}

const NOT_BUILT: { state: string; plan: Checked[]; answer?: () => (call: Sent) => Reply }[] = [
  { state: 'unfinished', plan: [], answer: leavingOpen },
  { state: 'failed', plan: Array.from({ length: CHECK_LIMITS.checks }, () => 'failed') },
  { state: 'unchecked', plan: ['platform'] },
]

for (const { state, plan, answer } of NOT_BUILT) {
  test(`só passed sobe: uma versão ${state} não vai ao app (5)`, async (t) => {
    const subject = await previewing(t, plan, answer?.())
    const { events, previews } = await turn(t, subject)
    const [version] = partsOf(events).flatMap((part) =>
      part.type === 'data-conexus-version' ? [part.data] : [],
    )
    assert.equal(Object(Object(version).check).state, state)
    assert.deepEqual(previews, [])
    assert.deepEqual(await versionsOf(subject), [])
    assert.deepEqual(subject.hub.cloudflare.workers(), [])
  })
}

test('nada guardado, nada sobe: um turno sem mudança e um que falhou ao guardar (6)', async (t) => {
  const remove = {
    type: 'tool_use',
    name: 'mastra_workspace_execute_command',
    input: { command: 'rm -rf .git' },
  } as const
  let asks = 0
  const subject = await previewing(t, ['passed', 'passed'], (callOf): Reply => {
    if (title(callOf) !== undefined) return { kind: 'text', text: 'Título' }
    asks += 1
    // The first turn only answers; the second writes and breaks the machine's Git before the save.
    if (asks === 2) return { kind: 'blocks', blocks: [WRITE, remove] }
    return { kind: 'text', text: 'Pronto.' }
  })
  const unchanged = await turn(t, subject)
  assert.deepEqual(unchanged.previews, [])
  const lost = await turn(t, subject)
  assert.deepEqual(
    partsOf(lost.events).flatMap((part) =>
      part.type === 'data-conexus-failure' ? [Object(part.data).code] : [],
    ),
    ['MACHINE_LOST'],
  )
  assert.deepEqual(lost.previews, [])
  assert.deepEqual(await versionsOf(subject), [])
  assert.deepEqual(subject.hub.cloudflare.workers(), [])
})

test('o membro envia pelo Builder (X1) (7)', async (t) => {
  const subject = await previewing(t)
  const bruno = await memberOn(subject.hub, subject.companyId, BRUNO, 'member')
  const { previews } = await turn(t, subject, bruno)
  assert.deepEqual(previews, [{ state: 'ready', number: 1 }])
  assert.deepEqual(await versionsOf(subject), [
    { number: 1, state: 'ready', live: true, failure: null, sentBy: bruno.id },
  ])
})

test('admissão relida: quem sai da empresa durante o envio não põe a versão no ar (8)', async (t) => {
  const subject = await previewing(t)
  const { hub, companyId } = subject
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  const held = hub.cloudflare.holdUpload()
  const turned = turn(t, subject, bruno)
  await held.arrived
  await hub.test.asOwner('delete from auth.member where user_id = $1 and company_id = $2', [
    bruno.id,
    companyId,
  ])
  held.release()
  const { previews } = await turned
  assert.deepEqual(previews, [])
  const [app] = await hub.test.asOwner('select live_version_id from apps.app')
  assert.equal(app?.live_version_id, null)
  assert.deepEqual(hub.cloudflare.workers(), [])
})

test('tirar a pessoa depois de guardada a versão: o turno dela não sobe nada e não diz Prévia (8)', async (t) => {
  const subject = await previewing(t)
  const { hub, companyId } = subject
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  const arrived = Promise.withResolvers<void>()
  const released = Promise.withResolvers<void>()
  hub.builder.knobs.holdPack = { arrived: arrived.resolve, released: released.promise }
  const turned = turn(t, subject, bruno)
  await arrived.promise
  const member = `/api/companies/${companyId}/members/${bruno.id}`
  assert.equal((await call(hub, subject.ana, 'DELETE', member)).statusCode, 204)
  released.resolve()
  const { previews } = await turned
  assert.deepEqual(previews, [])
  assert.deepEqual(await versionsOf(subject), [])
  assert.deepEqual(hub.cloudflare.workers(), [])
})

test('admissão no envio: a empresa marcada para apagar com o turno no ar não guarda nem sobe a versão (8)', async (t) => {
  const subject = await previewing(t)
  const { hub, companyId } = subject
  const arrived = Promise.withResolvers<void>()
  const released = Promise.withResolvers<void>()
  hub.builder.knobs.holdPack = { arrived: arrived.resolve, released: released.promise }
  const turned = turn(t, subject)
  await arrived.promise
  // Straight to the row: the run is not stopped, so only the send's admission can refuse it.
  await hub.test.asOwner('update auth.company set deleting_since = now() where id = $1', [
    companyId,
  ])
  released.resolve()
  const { previews } = await turned
  assert.deepEqual(previews, [])
  assert.deepEqual(await hub.test.asOwner('select id from apps.app_version'), [])
  assert.deepEqual(hub.cloudflare.workers(), [])
})

test('não inicia: a Cloudflare recusa, a parte diz APP_VERSION_NOT_STARTING e o app segue na anterior (9)', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana } = subject
  assert.deepEqual((await send(subject, ana)).preview, { state: 'ready', number: 1 })
  hub.cloudflare.script('upload', 'NOT_STARTING')
  const { preview } = await send(subject, ana, folder({}, '#6b2fa3'))
  assert.deepEqual(preview, { state: 'failed', number: 2, code: 'APP_VERSION_NOT_STARTING' })
  assert.deepEqual(
    (await listed(subject)).map(({ number, state, live }) => [number, state, live]),
    [
      [2, 'failed', false],
      [1, 'ready', true],
    ],
  )
})

test('o número da conversa: Versões lista as versões do Builder que montaram, e Voltar põe no ar a da conversa (33)', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana, projects, projectId } = subject
  const failing = Array.from({ length: CHECK_LIMITS.checks }, () => 'failed' as const)
  const turns = [
    await send(subject, ana),
    await send(subject, ana, folder({}, '#111111'), { plan: failing }),
    await send(subject, ana, folder({}, '#6b2fa3')),
  ]
  assert.deepEqual(
    turns.map(({ number, preview }) => [number, preview]),
    [
      [1, { state: 'ready', number: 1 }],
      [2, undefined],
      [3, { state: 'ready', number: 3 }],
    ],
  )
  assert.deepEqual(
    (await listed(subject)).map(({ number, live }) => [number, live]),
    [
      [3, true],
      [1, false],
    ],
  )
  const published = await call(hub, ana, 'PUT', `${projects}/${projectId}/published-version`, {
    number: 1,
  })
  assert.equal(published.statusCode, 200, published.body)
  const read = await call(hub, ana, 'GET', `${projects}/${projectId}`)
  assert.deepEqual(
    [Object(read.json()).project.appVersion, Object(read.json()).project.publishedVersion],
    [3, 1],
  )
})

test('número já usado: o Git que voltou um commit dá um número que o Projeto tem, e a chave o recusa sem renomear (34)', async (t) => {
  const subject = await companyForVersions(t)
  const { hub, ana } = subject
  // Version 1 as it was before a lost disk took the newest commit back (decision 0051).
  await plantVersion(subject, { id: 'e'.repeat(32), number: 1, state: 'ready' })
  const { preview } = await send(subject, ana)
  assert.deepEqual(preview, { state: 'failed', number: 1, code: 'APP_VERSION_FAILED' })
  // The key refused it: the store's insert met unique (project_id, number), SQLSTATE 23505.
  assert.ok(hub.lines.some((line) => line.fields.code === '23505'))
  assert.deepEqual(
    (await listed(subject)).map(({ id, number, state }) => [id, number, state]),
    [['e'.repeat(32), 1, 'ready']],
  )
  assert.deepEqual(hub.cloudflare.workers(), [])
})

test('o mesmo turno de novo: uma versão que já tem a chave do turno faz a chave recusar o envio, sem repetir (34)', async (t) => {
  const subject = await previewing(t)
  const { hub, companyId, projectId, ana } = subject
  const arrived = Promise.withResolvers<void>()
  const released = Promise.withResolvers<void>()
  hub.builder.knobs.holdPack = { arrived: arrived.resolve, released: released.promise }
  const turned = turn(t, subject)
  await arrived.promise
  const runId = hub.lines.find((line) => line.message === 'RUN_ADMITTED')?.fields.runId
  await hub.test.asOwner(
    'insert into apps.app (project_id, company_id) values ($1, $2) on conflict do nothing',
    [projectId, companyId],
  )
  // The run's send as if it had gone before, under another number: only its key is shared.
  await hub.test.asOwner(
    `insert into apps.app_version (id, company_id, project_id, number, state, manifest, digest,
       sent_by, attempt_key, created_at)
     values ($1, $2, $3, 7, 'ready', '{}', repeat('0', 64), $4, $5, now())`,
    ['f'.repeat(32), companyId, projectId, ana.id, runId],
  )
  released.resolve()
  const { previews } = await turned
  assert.deepEqual(previews, [{ state: 'failed', number: 1, code: 'APP_VERSION_FAILED' }])
  assert.ok(hub.lines.some((line) => line.fields.code === '23505'))
  assert.deepEqual(await versionsOf(subject), [
    { number: 7, state: 'ready', live: false, failure: null, sentBy: ana.id },
  ])
  assert.deepEqual(hub.cloudflare.workers(), [])
})

test('um envio de cada vez: com a trava viva de outro envio, o do Builder falha APP_VERSION_SENDING (34)', async (t) => {
  const subject = await companyForVersions(t)
  const { ana } = subject
  // Another Hub's send, as in a deploy: one Hub runs one turn per Projeto (data D15).
  await plantVersion(subject, {
    id: 'c'.repeat(32),
    number: 9,
    state: 'sending',
    claim: '1 minute',
  })
  const { preview } = await send(subject, ana)
  assert.deepEqual(preview, { state: 'failed', number: 1, code: 'APP_VERSION_SENDING' })
  assert.deepEqual(
    (await listed(subject)).map(({ number, state }) => [number, state]),
    [[9, 'sending']],
  )
})

test('pasta recusada: a versão trocada por um link na máquina falha APP_VERSION_FAILED, NOT_REGULAR (11)', async (t) => {
  const subject = await previewing(t, ['linked'])
  const { previews } = await turn(t, subject)
  assert.deepEqual(previews, [{ state: 'failed', number: 1, code: 'APP_VERSION_FAILED' }])
  const refused = subject.lines.filter((line) => line.message === 'PREVIEW_PACK_REFUSED')
  assert.deepEqual(
    refused.map((line) => line.fields.reason),
    ['NOT_REGULAR'],
  )
  assert.deepEqual(await versionsOf(subject), [])
})

test('pasta que não bate com o manifesto: um arquivo que falta ou um a mais não sobe, APP_VERSION_FAILED, VERSION_INVALID', async (t) => {
  const cases = {
    falta: folder({ assets: ['index.html', 'style.css', 'logo.svg'] }),
    'a mais': folder({ assets: ['index.html'] }),
  }
  for (const [name, mismatched] of Object.entries(cases)) {
    await t.test(name, async (t) => {
      const subject = await previewing(t)
      checking(subject.hub.builder.folder, ['passed'], mismatched)
      const { previews } = await turn(t, subject)
      assert.deepEqual(previews, [{ state: 'failed', number: 1, code: 'APP_VERSION_FAILED' }])
      const refused = subject.lines.filter((line) => line.message === 'PREVIEW_PACK_REFUSED')
      assert.deepEqual(
        refused.map((line) => line.fields.reason),
        ['VERSION_INVALID'],
      )
      assert.deepEqual(await versionsOf(subject), [])
      assert.deepEqual(await subject.hub.test.asOwner('select id from apps.app_version'), [])
      assert.deepEqual(subject.hub.cloudflare.workers(), [])
    })
  }
})

test('Projeto apagado durante o envio: nada no ar e nenhuma parte da Prévia (12)', async (t) => {
  const subject = await previewing(t)
  const { hub } = subject
  const held = hub.cloudflare.holdUpload()
  const turned = turn(t, subject)
  await held.arrived
  await hub.test.asOwner('update projects.project set deleting_since = now()')
  held.release()
  const { previews } = await turned
  assert.deepEqual(previews, [])
  const [app] = await hub.test.asOwner('select live_version_id from apps.app')
  assert.equal(app?.live_version_id, null)
  assert.deepEqual(hub.cloudflare.workers(), [])
})
