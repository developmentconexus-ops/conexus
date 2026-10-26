import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { TestContext } from 'node:test'
import type { CheckReport } from '@conexus/app/check'
import { STEP_NAMES } from '@conexus/app/check'
import { AppVersion, PreviewData } from '@conexus/hub-api'
import { z } from 'zod'
import type { Anthropic, Reply } from '../../platform/test-anthropic.ts'
import { plantAnthropic } from '../../platform/test-anthropic.ts'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  call,
  hubWithLog,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'

export const MIGRATION = {
  id: '001_recado',
  statements: [
    'CREATE TABLE recado (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, texto text NOT NULL)',
  ],
}

function base64(value: string): string {
  return Buffer.from(value).toString('base64')
}

/** A version's folder as the machine's check leaves it: a small Recados, its files in base64 (T19). */
export function folder(change: Record<string, unknown> = {}, color = '#0b6e4f') {
  const manifest = {
    contract: 1,
    entry: 'worker.js',
    operations: {
      listarRecados: { input: { type: 'object', properties: {} }, output: { type: 'string' } },
    },
    migrations: [MIGRATION],
    assets: ['index.html', 'style.css'],
    ...change,
  }
  return {
    manifest,
    files: [
      { path: 'worker.js', mediaType: 'text/javascript', base64: base64('export default {}') },
      { path: 'assets/index.html', mediaType: 'text/html', base64: base64('<h1>Recados</h1>') },
      { path: 'assets/style.css', mediaType: 'text/css', base64: base64(`:root{--cor:${color}}`) },
    ],
  }
}

export type Folder = ReturnType<typeof folder>

const PASSED: CheckReport = {
  ok: true,
  steps: STEP_NAMES.map((name) => ({ name, state: 'passed', problems: [] })),
}
const FAILED: CheckReport = {
  ok: false,
  steps: STEP_NAMES.map((name, at) => {
    if (at === 0) {
      const problem = { file: 'server/handlers.ts', line: 1, column: 1, code: 'TS2322' }
      return { name, state: 'failed', problems: [{ ...problem, message: 'Type mismatch.' }] }
    }
    return { name, state: 'skipped', problems: [] }
  }),
}

/**
 * What the end of the turn's check does each time: passes and leaves the version where the
 * template's check leaves it (`node_modules/.conexus/version`), passes and leaves a link there in
 * its place, fails, or cannot run (exit 2).
 */
export type Checked = 'passed' | 'linked' | 'failed' | 'platform'

/**
 * The machine's check program of the test Hub (`testBuilderPorts`), counting its calls again: the
 * n-th call does the n-th of `plan`, and passes past it, leaving `version`.
 */
export function checking(machineFolder: string, plan: readonly Checked[], version: Folder) {
  const built = join(machineFolder, 'built-version')
  rmSync(built, { recursive: true, force: true })
  for (const file of version.files) {
    const path = join(built, file.path)
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, Buffer.from(file.base64, 'base64'))
  }
  writeFileSync(join(built, 'manifest.json'), JSON.stringify(version.manifest))
  writeFileSync(join(machineFolder, 'check-plan'), plan.join('\n'))
  writeFileSync(join(machineFolder, 'check-passed.json'), JSON.stringify(PASSED))
  writeFileSync(join(machineFolder, 'check-failed.json'), JSON.stringify(FAILED))
  const count = join(machineFolder, 'check-count')
  rmSync(count, { force: true })
  const program = join(machineFolder, 'check')
  writeFileSync(
    program,
    [
      '#!/bin/sh',
      // Called as `check --root <app folder>`.
      'out="$2/node_modules/.conexus/version"',
      `n=$(( $(cat '${count}' 2>/dev/null || echo 0) + 1 ))`,
      `echo $n > '${count}'`,
      `step=$(sed -n "\${n}p" '${machineFolder}/check-plan')`,
      '[ "$step" = platform ] && exit 2',
      `[ "$step" = failed ] && exec cat '${machineFolder}/check-failed.json'`,
      'rm -rf "$out" && mkdir -p "$(dirname "$out")"',
      `if [ "$step" = linked ]; then ln -s '${built}' "$out"; else cp -r '${built}' "$out"; fi`,
      `cat '${machineFolder}/check-passed.json'`,
    ].join('\n'),
  )
  chmodSync(program, 0o755)
  return { calls: () => (existsSync(count) ? Number(readFileSync(count, 'utf8')) : 0) }
}

/** How a send asks the Builder for a version: each ask is new, so each turn saves one. */
export const ASK = 'Guarde uma versão nova: '

/**
 * A model that writes the asked text to a file when a send asks, and answers after: every send's
 * turn changes the app, so it saves a version.
 */
export function versionWriting(): Anthropic['answer'] {
  return (sent): Reply => {
    if (!sent.stream) return { kind: 'text', text: 'Título' }
    const last = sent.texts.at(-1) ?? ''
    if (!last.startsWith(ASK)) return { kind: 'text', text: 'Pronto.' }
    const input = { path: 'versao.ts', content: `${last}\n` }
    return {
      kind: 'blocks',
      blocks: [{ type: 'tool_use', name: 'mastra_workspace_write_file', input }],
    }
  }
}

const MODEL = { model: 'anthropic/claude-sonnet-4-6', effort: 'off' }

/**
 * The company's Builder ready to save versions, as its owner sets it: an Anthropic key and the
 * default model, the model a `versionWriting` double.
 */
export async function readyForVersions(t: TestContext, hub: Hub, owner: Person, companyId: string) {
  plantAnthropic(t, versionWriting())
  const company = `/api/companies/${companyId}`
  const account = { owner: 'company', provider: 'anthropic', label: 'Time 1', key: 'sk-ant-v-1' }
  assert.equal((await post(hub, owner, `${company}/model-accounts`, account)).statusCode, 201)
  assert.equal((await call(hub, owner, 'PUT', `${company}/default-model`, MODEL)).statusCode, 200)
}

/**
 * Empresa A with Ana its owner, Bruno a member, its Builder ready, and the Projeto Pedidos, whose
 * company database is one of the test server, as Neon would give it: a Builder turn there saves a
 * version and sends it to the app.
 */
export async function companyForVersions(t: TestContext) {
  const hub = await hubWithLog(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa A', 'empresa-a')
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  await readyForVersions(t, hub, ana, companyId)
  const projects = `/api/companies/${companyId}/projects`
  const made = await post(hub, ana, projects, { name: 'Pedidos' })
  const projectId = String(Object(made.json()).project.id)
  const [neonProject] = hub.neon.projects()
  if (neonProject === undefined) throw new Error('no company database')
  const owner = await createCompanyDatabase(t)
  hub.neon.ownedBy(neonProject.id, owner)
  const versions = `${projects}/${projectId}/versions`
  return { t, hub, ana, bruno, companyId, projectId, owner, projects, versions }
}

/** Where a send goes: a Projeto of a company whose Builder is ready (`readyForVersions`). */
type Subject = { t: TestContext; hub: Hub; projects: string; projectId: string }

const Frame = z.looseObject({ type: z.string() })
const Part = z.looseObject({ type: z.string(), data: z.unknown().optional() })

/** The parts the stream's events said, as `test-parts.ts` reads them for the Builder's tests. */
function partsIn(event: z.infer<typeof Frame>): z.infer<typeof Part>[] {
  if (event.type === 'message_start') {
    return z.array(Part).parse(Object(Object(event.message).content).parts)
  }
  const update = Object(event.event)
  return event.type === 'message_update' && update.type === 'part' ? [Part.parse(update.part)] : []
}

/** The conversation's stream, Mastra's own route, until its run ends (`agent_end`). */
async function turnOn(hub: Hub, person: Person, conversationId: string) {
  const response = await hub.app.inject({
    method: 'GET',
    url: `/api/builder/agent-controller/builder/sessions/${conversationId}/stream`,
    headers: { origin: TEST_ORIGIN, cookie: person.cookie },
    payloadAsStream: true,
  })
  assert.equal(response.statusCode, 200)
  const stream = response.stream()
  const ended = Promise.withResolvers<z.infer<typeof Part>[]>()
  const parts: z.infer<typeof Part>[] = []
  let buffered = ''
  stream.on('data', (chunk: Buffer) => {
    buffered += chunk.toString('utf8')
    const frames = buffered.split('\n\n')
    buffered = frames.pop() ?? ''
    for (const frame of frames.filter((each) => each.startsWith('data: '))) {
      const event = Frame.parse(JSON.parse(frame.slice(6)))
      parts.push(...partsIn(event))
      if (event.type === 'agent_end') ended.resolve(parts)
    }
  })
  stream.on('close', () => ended.reject(new Error('the stream closed before agent_end')))
  return { ended: ended.promise, close: () => stream.destroy() }
}

/** What a send's turn said: the version it saved and whether, and how, it reached the app. */
export type Turned = { number: number | undefined; preview: PreviewData | undefined }

/**
 * Sends a version as the person, the Builder's way: a turn on a new conversation of the Projeto,
 * whose check `plan` leaves `version` for the end of the turn to send.
 */
export async function send(
  subject: Subject,
  person: Person,
  version: Folder = folder(),
  options: { projectId?: string; plan?: readonly Checked[] } = {},
): Promise<Turned> {
  const { hub } = subject
  checking(hub.builder.folder, options.plan ?? [], version)
  const conversations = `${subject.projects}/${options.projectId ?? subject.projectId}/conversations`
  const made = await post(hub, person, conversations, {}, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  const conversationId = String(Object(made.json()).conversation.id)
  const turn = await turnOn(hub, person, conversationId)
  subject.t.after(turn.close)
  const messages = `/api/builder/agent-controller/builder/sessions/${conversationId}/messages`
  const asked = await post(hub, person, messages, { message: `${ASK}${randomUUID()}` })
  assert.equal(asked.statusCode, 200, asked.body)
  const parts = await turn.ended
  function data(type: string) {
    return parts.flatMap((part) => (part.type === type ? [part.data] : []))
  }
  const [saved] = data('data-conexus-version')
  const [preview] = data('data-conexus-preview')
  return {
    number: saved === undefined ? undefined : z.object({ number: z.int() }).parse(saved).number,
    preview: preview === undefined ? undefined : PreviewData.parse(preview),
  }
}

/** The Projeto's versions as its owner lists them on the Versões tab, newest first. */
export async function listed(
  subject: Pick<Subject, 'hub' | 'projects' | 'projectId'> & { ana: Person },
  projectId = subject.projectId,
): Promise<AppVersion[]> {
  const read = await call(
    subject.hub,
    subject.ana,
    'GET',
    `${subject.projects}/${projectId}/versions`,
  )
  assert.equal(read.statusCode, 200, read.body)
  return z.array(AppVersion).parse(Object(read.json()).versions)
}

/** The listed version the Builder saved as `number`. */
export async function versionNumbered(
  subject: Parameters<typeof listed>[0],
  number: number | undefined,
  projectId = subject.projectId,
): Promise<AppVersion> {
  const found = (await listed(subject, projectId)).find((version) => version.number === number)
  assert.ok(found !== undefined, `version ${number} is listed`)
  return found
}

/**
 * A version of the Projeto planted in the database as another Hub, or the Hub before a lost disk,
 * left it: `sending` holds the Projeto's claim for `claim` (an interval, past when negative).
 */
export async function plantVersion(
  subject: Pick<Subject, 'hub' | 'projectId'> & { companyId: string; ana: Person },
  version: { id: string; number: number } & (
    | { state: 'ready' }
    | { state: 'sending'; claim: string }
  ),
) {
  const { hub, projectId, companyId } = subject
  await hub.test.asOwner(
    'insert into apps.app (project_id, company_id) values ($1, $2) on conflict do nothing',
    [projectId, companyId],
  )
  await hub.test.asOwner(
    `insert into apps.app_version (id, company_id, project_id, number, state, manifest, digest,
       sent_by, attempt_key, created_at)
     values ($1, $2, $3, $4, $5, '{}', repeat('0', 64), $6, $1, now())`,
    [version.id, companyId, projectId, version.number, version.state, subject.ana.id],
  )
  if (version.state !== 'sending') return
  await hub.test.asOwner(
    `update apps.app set sending_version_id = $1, claimed_until = now() + $2::interval
      where project_id = $3`,
    [version.id, version.claim, projectId],
  )
}
