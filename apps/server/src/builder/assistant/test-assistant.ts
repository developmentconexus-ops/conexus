import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { ConversationId } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import type { SessionScope, TurnKey } from '../../hub/connectors/public.ts'
import { linkSankhya, servedSankhya, testOf } from '../../hub/connectors/test-connections.ts'
import { salesSankhya } from '../../hub/connectors/test-sales.ts'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import {
  ANA_OWNER,
  call,
  hubWithLog,
  personOn,
  plantCompany,
  post,
} from '../../hub/identity/test-hub.ts'
import type { Anthropic, Sent } from '../../platform/test-anthropic.ts'
import { conversing, MODEL, sent, streamOf } from '../conversation/test-conversation.ts'
import { stepping, tool } from '../conversation/test-questions.ts'
import { createE2bApi, createE2bKit } from '../machine/public.ts'
import { realE2b } from '../machine/test-machine.ts'

type Block = ReturnType<typeof tool>

export const READ = 'connector_read'
export const COUNT = 'SELECT COUNT(*) AS N FROM TSIEMP'

/** A `connector_read` of `connection` with a query. */
export function reading(connection = 'Matriz', sql = COUNT): Block {
  return tool(READ, { connection, operation: 'sankhya.consultar', input: { sql } })
}

/** The kit's Sankhya double, both connections on it with the same credential. */
async function kitSankhya(t: TestContext): Promise<Sankhyas> {
  const fake = await servedSankhya(t)
  return { origin: fake.origin, matriz: fake.credential, filial: fake.credential }
}

/** A text the model answers. */
export function said(text: string): Block {
  return { type: 'text', text }
}

/** One read the company's door received from the Assistant: the scope and the turn it came under. */
export type DoorRead = { scope: SessionScope; turn: TurnKey; connectionId: string }

/** Where the Sankhya connections are served, and the credential each is linked with. */
type Sankhyas = { origin: string; matriz: Record<string, string>; filial: Record<string, string> }

/**
 * Empresa Teste with Ana its owner and a model account, the Projeto Encomendas, and two Sankhya
 * connections, on the kit's double or on `sankhya`: Matriz, released to the Projeto, and Filial,
 * not. The model answers `model`'s steps in order, then `Pronto.`, or as `model` answers; every
 * streamed call to it is in `calls`, every read the door receives from the Assistant in `reads`.
 */
export async function assisting(
  t: TestContext,
  model: Block[][] | Anthropic['answer'] = [],
  sankhya?: Sankhyas,
) {
  const calls: Sent[] = []
  const served = sankhya ?? (await kitSankhya(t))
  const answer = Array.isArray(model)
    ? stepping(model, calls)
    : (asked: Sent) => {
        if (asked.stream) calls.push(asked)
        return model(asked)
      }
  const on = await conversing(t, answer, (config) => ({
    ...config,
    connectorOrigins: new Map([['sankhya', served.origin]]),
  }))
  const { hub, ana, companyId, projectId } = on
  const company = `/api/companies/${companyId}`
  async function link(name: 'Matriz' | 'Filial') {
    const credential = name === 'Matriz' ? served.matriz : served.filial
    const linked = await linkSankhya(
      hub,
      ana,
      `${company}/connections`,
      credential,
      undefined,
      name,
    )
    assert.equal(linked.statusCode, 201, linked.body)
    const id = String(Object(linked.json()).connection.id)
    assert.equal(
      Object((await testOf(hub, ana, `${company}/connections`, id)).json()).result,
      'WORKING',
    )
    return id
  }
  const matriz = await link('Matriz')
  const filial = await link('Filial')
  const released = await call(
    hub,
    ana,
    'PUT',
    `${company}/projects/${projectId}/connections/${matriz}`,
  )
  assert.equal(released.statusCode, 200, released.body)

  const reads: DoorRead[] = []
  const door = hub.connectors.assistant
  const readBy = door.read.bind(door)
  door.read = (scope, a) => {
    reads.push({ scope, turn: a.turn, connectionId: a.connectionId })
    return readBy(scope, a)
  }
  return {
    ...on,
    company,
    assistant: `${company}/assistant/conversations`,
    matriz,
    filial,
    calls,
    reads,
  }
}

/** A new conversation of the Assistant, created by `person` with `body`; its Hub URL. */
export async function created(hub: Hub, person: Person, assistant: string, body: object) {
  const made = await post(hub, person, assistant, body, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  return `${assistant}/${String(Object(made.json()).conversation.id)}`
}

/** The conversation's stream, open until the test ends, and a question that returns its turn's events. */
export async function talking(t: TestContext, hub: Hub, person: Person, url: string) {
  const stream = await streamOf(hub, person, url)
  t.after(() => stream.close())
  async function say(content: string) {
    const asked = await sent(hub, person, url, content)
    assert.equal(asked.statusCode, 200, asked.body)
    return stream.turn()
  }
  return { stream, say }
}

/** The sign-in code firstmate writes after opening the link, read once and deleted; never printed. */
async function codeFrom(folder: string): Promise<string> {
  const path = join(folder, 'code.txt')
  for (let waited = 0; waited < 600; waited += 1) {
    if (existsSync(path)) {
      const code = readFileSync(path, 'utf8').trim()
      rmSync(path)
      return code
    }
    await sleep(1000)
  }
  throw new Error('No sign-in code arrived in ten minutes.')
}

/** A Hub that calls the real model, through a Claude subscription signed in by the routes, as a person signs in. */
export async function subscribed(t: TestContext, folder: string) {
  const sankhya = await salesSankhya(t)
  const e2b = realE2b()
  const hub = await hubWithLog(
    t,
    (config) => ({ ...config, connectorOrigins: new Map([['sankhya', sankhya.origin]]) }),
    // The machine the Hub would give: the real E2B template when its two switches are set, the local kit otherwise.
    (local) => {
      if (e2b === undefined) return local
      const { workFolder, ...rest } = local
      return {
        ...rest,
        kit: createE2bKit(e2b),
        api: createE2bApi(e2b, local.mark),
        template: e2b.machineTemplate,
      }
    },
  )
  const reads: string[] = []
  const door = hub.connectors.assistant
  const readBy = door.read.bind(door)
  door.read = (scope, a) => {
    reads.push(a.connectionId)
    return readBy(scope, a)
  }
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Padaria Sol')
  const company = `/api/companies/${companyId}`
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'claude_subscription')`,
    [companyId],
  )
  const body = { owner: 'company', kind: 'claude_subscription', label: 'Assinatura' }
  const opened = await post(hub, ana, `${company}/model-account-sign-ins`, body)
  assert.equal(opened.statusCode, 201, opened.body)
  const { url, signInId } = Object(opened.json())
  writeFileSync(join(folder, 'authorize-url.txt'), `${url}\n`)
  const code = await codeFrom(folder)
  const linked = await post(hub, ana, `${company}/model-account-sign-ins/${signInId}`, { code })
  assert.equal(linked.statusCode, 201, linked.body)
  const model = { model: MODEL, effort: 'off' }
  assert.equal((await call(hub, ana, 'PUT', `${company}/default-model`, model)).statusCode, 200)
  const connections = `${company}/connections`
  const ids = []
  for (const [name, credential] of [
    ['Matriz', sankhya.matriz],
    ['Filial', sankhya.filial],
  ] as const) {
    const made = await linkSankhya(hub, ana, connections, credential, undefined, name)
    const id = String(Object(made.json()).connection.id)
    assert.equal(Object((await testOf(hub, ana, connections, id)).json()).result, 'WORKING')
    ids.push(id)
  }
  const projected = await post(hub, ana, `${company}/projects`, { name: 'Vendas' })
  const projectId = String(Object(projected.json()).project.id)
  const grant = `${company}/projects/${projectId}/connections/${ids[0]}`
  assert.equal((await call(hub, ana, 'PUT', grant)).statusCode, 200)
  const machine = e2b === undefined ? 'local kit' : `E2B, template ${e2b.machineTemplate}`
  t.diagnostic(`the machine of this run: ${machine}`)
  // The real machines are killed at the end, as the Hub kills a deleted conversation's.
  function track(url: string) {
    if (e2b === undefined) return
    t.after(() => createE2bApi(e2b, hub.assistantMachines.deps.mark).kill(idOf(url)))
  }
  return {
    ...{ hub, ana, company, reads, track },
    ...{ assistant: `${company}/assistant/conversations`, matriz: ids[0], projectId },
  }
}

function idOf(url: string) {
  return ConversationId.parse(url.split('/').at(-1))
}

/** What `show_file` showed in the answer, in order: the file's kind, name, type and, for a file, its size. */
export function shownFiles(parts: MastraMessagePart[]) {
  return parts.flatMap((part) => {
    const found = Object(part)
    const invoked = found.toolInvocation
    if (found.type !== 'tool-invocation' || invoked?.toolName !== 'show_file') return []
    const { kind, name, media, bytes } = Object(invoked.result)
    return [{ kind: String(kind), name: String(name), media: String(media), bytes }]
  })
}

export function described(files: ReturnType<typeof shownFiles>): string {
  return files.map((file) => `${file.name} (${file.media}, ${file.kind})`).join('; ') || 'none'
}

/** The numbers the turn's tools returned, for an ask whose truth is the reads themselves (the orders document has no figure the test computes). */
export function returnedNumbers(parts: MastraMessagePart[]): number[] {
  function numbersOf(value: unknown): number[] {
    if (typeof value === 'number') return [value]
    if (Array.isArray(value)) return value.flatMap(numbersOf)
    if (value !== null && typeof value === 'object') return Object.values(value).flatMap(numbersOf)
    return []
  }
  return parts.flatMap((part) => {
    const invoked = Object(part).toolInvocation
    return invoked?.state === 'result' ? numbersOf(invoked.result) : []
  })
}
