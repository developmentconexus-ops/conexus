import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import {
  ASSISTANT_TOOL,
  ATTEMPT_KEY_HEADER,
  CompanyId,
  ConnectionId,
  ConversationId,
  PersonId,
  ProjectId,
  READER_ZONE_HEADER,
} from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { conversing, sessionUrl, streamOf } from '../../harness/routes/test-conversation.ts'
import { stepped, tool } from '../../harness/routes/test-questions.ts'
import type { RunScope } from '../../harness/spec/public.ts'
import type { Principal } from '../../hub/access/public.ts'
import { chooserAt } from '../../hub/access/test-principal.ts'
import type { TurnKey } from '../../hub/connectors/public.ts'
import { linkSankhya, servedSankhya, testOf } from '../../hub/connectors/test-connections.ts'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import type { Config } from '../../platform/config.ts'
import { Failure } from '../../platform/failure.ts'
import type { Anthropic, Sent } from '../../platform/test-anthropic.ts'
import { silent as silentLog, TEST_ORIGIN } from '../../platform/test-database.ts'
import { companyToolScope, companyTools } from '../company-tools/public.ts'

type Block = ReturnType<typeof tool>

/** A file the person sends with a message, as the screen sends it: a name, a type and a data URL. */
/** The note's two templates, for the tests that read what a person keeps. */
export { LEGACY_PROFILE_TEMPLATE, PROFILE_TEMPLATE } from './memory.ts'

export type Upload = { filename: string; mediaType: string; data: string }

/** Sankhya's SQL read as the Assistant's typed tool. */
export const READ = 'sankhya_consultar'
export const SEARCH = 'search_tools'
export const COUNT = 'SELECT COUNT(*) AS N FROM TSIEMP'

/** A search for the typed reads, loaded for the model's next step; by the read's own name it finds that read first. */
export function searching(query = READ): Block {
  return tool(SEARCH, { query })
}

/** A read of `connection` with a query, through the typed tool `searching` loads. */
export function reading(connection = 'Matriz', sql = COUNT): Block {
  return tool(READ, { connection, sql })
}

/** The main agent asks the helper for a research, as the Assistant's text tells it to (U12). */
export function researching(task = 'Quantas empresas a Matriz tem?', more: object = {}): Block {
  return tool('subagent', { agentType: 'pesquisar', task, ...more })
}

/** The helper's read of the Matriz through `connector_read`. */
export function helperReading(sql = COUNT): Block {
  return tool('connector_read', {
    connection: 'Matriz',
    operation: 'sankhya.consultar',
    input: { sql },
  })
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

/** Ana's Assistant conversation in the Início (`null`) or the Projeto, which chose `chosen`, as the door reads it. */
export function anasChoice(
  on: { companyId: string; ana: { id: string } },
  projectId: string | null,
  chosen: readonly string[],
): Principal {
  const companyId = CompanyId.parse(on.companyId)
  const place =
    projectId === null
      ? ({ kind: 'COMPANY' } as const)
      : ({ kind: 'PROJECT', projectId: ProjectId.parse(projectId) } as const)
  const connections = chosen.map((each) => ConnectionId.parse(each))
  return chooserAt({ companyId, personId: PersonId.parse(on.ana.id), place }, connections)
}

/** One read the company's door received from the Assistant: the scope and the turn it came under. */
export type DoorRead = { scope: Principal; turn: TurnKey; connectionId: string }

/** Where the Sankhya connections are served, and the credential each is linked with. */
type Sankhyas = { origin: string; matriz: Record<string, string>; filial: Record<string, string> }

/**
 * Empresa Teste with Ana its owner and a model account, the Projeto Encomendas, and two Sankhya
 * connections, on the kit's double or on `sankhya`: Matriz, released to the Projeto, and Filial,
 * not. The model answers `model`'s steps in order, then `Pronto.`, or as `model` answers; every
 * streamed call to it is in `calls`, every read the door receives from the Assistant in `reads`.
 * `change` sets the Hub's config apart from the test one.
 */
export async function assisting(
  t: TestContext,
  model: Block[][] | Anthropic['answer'] = [],
  sankhya?: Sankhyas,
  change: (config: Config) => Config = (same) => same,
) {
  const calls: Sent[] = []
  const served = sankhya ?? (await kitSankhya(t))
  const answer = Array.isArray(model)
    ? stepped(
        model.map((blocks) => () => blocks),
        calls,
      )
    : (asked: Sent) => {
        if (asked.stream) calls.push(asked)
        return model(asked)
      }
  const on = await conversing(t, answer, (config) => ({
    ...change(config),
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

/** The company's ChatGPT subscription, signed in through the double's device flow (`plantCodex`). */
export async function subscribed(on: Awaited<ReturnType<typeof assisting>>) {
  await on.hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'openai_codex')`,
    [on.companyId],
  )
  const signIns = `${on.company}/model-account-sign-ins`
  const begun = await post(on.hub, on.ana, signIns, {
    owner: 'company',
    kind: 'openai_codex',
    label: 'Assinatura',
  })
  assert.equal(begun.statusCode, 201, begun.body)
  const polled = await on.hub.app.inject({
    method: 'POST',
    url: `${signIns}/${String(Object(begun.json()).signInId)}/poll`,
    headers: { origin: TEST_ORIGIN, cookie: on.ana.cookie, [ATTEMPT_KEY_HEADER]: randomUUID() },
  })
  assert.equal(polled.statusCode, 200, polled.body)
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
  async function say(content: string, files: Upload[] = [], zone?: string) {
    const body = files.length === 0 ? { message: content } : { message: content, files }
    const more: Record<string, string> = zone === undefined ? {} : { [READER_ZONE_HEADER]: zone }
    const asked = await post(hub, person, `${sessionUrl(url)}/messages`, body, undefined, more)
    assert.equal(asked.statusCode, 200, asked.body)
    return stream.turn()
  }
  return { stream, say }
}

/** A published app in the Projeto, at version 3, as the Hub keeps it: what `conexus_overview` reads. */
export async function publishedApp(
  hub: Hub,
  owned: { companyId: string; projectId: string; personId: string },
) {
  const versionId = randomUUID().replaceAll('-', '')
  await hub.test.asOwner('insert into apps.app (project_id, company_id) values ($1, $2)', [
    owned.projectId,
    owned.companyId,
  ])
  await hub.test.asOwner(
    `insert into apps.app_version (id, company_id, project_id, number, state, manifest, digest,
       sent_by, attempt_key, created_at)
     values ($1, $2, $3, 3, 'ready', '{}'::jsonb, repeat('0', 64), $4, $1, now())`,
    [versionId, owned.companyId, owned.projectId, owned.personId],
  )
  await hub.test.asOwner('update apps.app set published_version_id = $1 where project_id = $2', [
    versionId,
    owned.projectId,
  ])
}

/** The Assistant's company tools, made for a conversation whose Hub cannot say what the person reaches (its database does not answer). */
export async function runOverviewOnSilentHub() {
  const run: RunScope = {
    kind: 'assistant',
    owner: {
      companyId: CompanyId.parse(randomUUID().replaceAll('-', '')),
      personId: PersonId.parse(randomUUID()),
    },
    place: { kind: 'COMPANY' },
    conversation: { kind: 'THREAD', id: ConversationId.parse(randomUUID()) },
    choice: { kind: 'CHOSEN', connections: [] },
    ceiling: { kind: 'PERSON' },
    attended: true,
  }
  const silent = {
    viewOf: async () => {
      throw new Failure('DATABASE_UNAVAILABLE')
    },
  }
  const scope = await companyToolScope(
    run,
    { access: silent, connections: async () => [] },
    { noteSave: false, appData: { kind: 'NONE' } },
  )
  const tools = await companyTools(scope, 'assistant', {
    log: silentLog,
    data: () => {
      throw new Error('the data is not read without a scope')
    },
    connector: { read: refused, notes: async () => null },
    projects: async () => ({ projects: [], moreProjects: false }),
  })
  return Object(tools[ASSISTANT_TOOL.overview]).execute(
    {},
    { requestContext: new RequestContext() },
  )
}

async function refused() {
  return { kind: 'NOT_GRANTED' } as const
}
