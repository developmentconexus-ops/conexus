import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { Rows } from '@conexus/connectors'
import {
  CompanyId,
  ConnectionId,
  ConversationId,
  OperationId,
  PersonId,
  ProjectId,
  REDIRECT_PATH,
  RunId,
  ToolCallId,
} from '@conexus/hub-api'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { call, codeOf, post } from '../identity/test-hub.ts'
import type { SessionScope, WriteRequest } from './public.ts'
import { TurnKey } from './public.ts'
import { appsOf, completeOf, consentAt, hubspotOn, startOf, testOf } from './test-connections.ts'

const HUBSPOT = { connector: 'hubspot', name: 'Portal da loja' }
const SCOPES = [
  'oauth',
  'crm.objects.contacts.read',
  'crm.objects.companies.read',
  'crm.objects.deals.read',
  'crm.objects.contacts.write',
  'settings.account.read',
]
const FIRST_CONTACT_EMAIL = 'contato1@exemplo.test'
const FIRST_CONTACT_PHONE = '5511988776655'

type On = Awaited<ReturnType<typeof hubspotOn>>

function failed(response: { statusCode: number; json(): unknown }) {
  return [response.statusCode, codeOf(response)]
}

async function linkHubspot(on: On, body: object = HUBSPOT) {
  const started = await startOf(on.hub, on.ana, on.companyId, body)
  const back = await consentAt(Object(started.json()).url)
  return completeOf(on.hub, on.ana, on.companyId, back.signInId, { code: back.code })
}

/** Empresa Teste with the Portal linked, tested and released to a Projeto; the member's role holds `reads`. */
async function portalOn(t: TestContext, reads: readonly string[] = ['contatos']) {
  const on = await hubspotOn(t)
  const linked = await linkHubspot(on)
  assert.equal(linked.statusCode, 200, linked.body)
  const connectionId = ConnectionId.parse(Object(linked.json()).connection.id)
  assert.equal(
    Object((await testOf(on.hub, on.ana, on.base, connectionId)).json()).result,
    'WORKING',
  )
  const company = `/api/companies/${on.companyId}`
  const made = await post(on.hub, on.ana, `${company}/projects`, { name: 'Vendas' })
  const projectId = ProjectId.parse(Object(made.json()).project.id)
  const grant = `${company}/projects/${projectId}/connections/${connectionId}`
  assert.equal((await call(on.hub, on.ana, 'PUT', grant)).statusCode, 200)
  const role = await call(on.hub, on.ana, 'PUT', `${company}/roles/member`, {
    connectors: { hubspot: reads },
    unattended: false,
  })
  assert.equal(role.statusCode, 200, role.body)
  const companyId = CompanyId.parse(on.companyId)
  const runId = RunId.parse(randomUUID())
  function builderRead(person: { id: string }, operation: string, input: unknown, run = runId) {
    return on.hub.connectors.builder.read(
      { companyId, projectId },
      { connectionId, personId: PersonId.parse(person.id), runId: run, operation, input },
    )
  }
  function scopeOf(person: { id: string }): SessionScope {
    return {
      companyId,
      personId: PersonId.parse(person.id),
      place: { kind: 'PROJECT', projectId },
      chosen: [connectionId],
    }
  }
  function assistantRead(person: { id: string }, operation: string, input: unknown) {
    const turn = TurnKey.parse(randomUUID())
    return on.hub.connectors.assistant.read(scopeOf(person), {
      connectionId,
      turn,
      operation,
      input,
    })
  }
  function noteBy(person: { id: string }, input: unknown): WriteRequest {
    const personId = PersonId.parse(person.id)
    return {
      scope: scopeOf(person),
      connectionId,
      operation: OperationId.parse('notaNoContato'),
      input,
      threadId: ConversationId.parse(randomUUID()),
      toolCallId: ToolCallId.parse(randomUUID()),
      turn: TurnKey.parse(randomUUID()),
      speaker: { kind: 'PERSON', personId },
      approvedBy: personId,
    }
  }
  return { ...on, connectionId, builderRead, assistantRead, noteBy }
}

test('a dona começa o login e recebe a página do dublê com os escopos do HubSpot', async (t) => {
  const on = await hubspotOn(t)
  const started = await startOf(on.hub, on.ana, on.companyId, HUBSPOT)
  assert.equal(started.statusCode, 201)
  const url = new URL(Object(started.json()).url)
  assert.equal(`${url.origin}${url.pathname}`, `${on.served.origin}/oauth/authorize`)
  assert.equal(url.searchParams.get('client_id'), on.fake.app.clientId)
  assert.equal(url.searchParams.get('redirect_uri'), `${TEST_ORIGIN}${REDIRECT_PATH}`)
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
  assert.deepEqual(url.searchParams.get('scope')?.split(' '), SCOPES)
  assert.equal(url.href.includes(on.fake.app.clientSecret), false)
})

test('sem a entrada hubspot no arquivo de apps, CONNECTOR_NOT_CONFIGURED', async (t) => {
  const other = { clientId: 'outro-app', clientSecret: 'outro-segredo' }
  const on = await hubspotOn(t, {
    change: (config) => ({ ...config, connectorApps: appsOf('mercado-livre', other) }),
  })
  assert.deepEqual(failed(await startOf(on.hub, on.ana, on.companyId, HUBSPOT)), [
    503,
    'CONNECTOR_NOT_CONFIGURED',
  ])
})

test('completar cria a ligação selada com a conta do portal', async (t) => {
  const on = await hubspotOn(t)
  const linked = await linkHubspot(on)
  assert.equal(linked.statusCode, 200)
  const { result, connection } = Object(linked.json())
  assert.equal(result, 'LINKED')
  assert.deepEqual(
    [connection.connector, connection.name, connection.state, connection.account],
    ['hubspot', 'Portal da loja', 'NEW', { label: 'Portal 987654321' }],
  )
  const [row] = await on.hub.test.asOwner(
    'select connector_id, account_ref, sealed is not null as sealed from connectors.connection',
  )
  assert.deepEqual(row, { connector_id: 'hubspot', account_ref: '987654321', sealed: true })
  const stored = JSON.stringify(
    await on.hub.test.asOwner('select sealed from connectors.connection'),
  )
  assert.equal(stored.includes(on.fake.app.clientSecret), false)
})

test('o Builder lê os contatos com a mesma forma de uma leitura do Mercado Livre', async (t) => {
  const on = await portalOn(t)
  const read = await on.builderRead(on.ana, 'contatos', { limit: 5 })
  assert.equal(read.kind, 'OK')
  if (read.kind !== 'OK') return
  const page = Rows.parse(read.value)
  assert.equal(page.linhas.length, 5)
  assert.equal(page.temMais, true)
  assert.equal(page.seguinte, '5')
  assert.deepEqual(Object.keys(Object(page.linhas[0])).sort(), [
    'archived',
    'createdAt',
    'id',
    'properties',
    'updatedAt',
  ])
  const next = await on.builderRead(on.ana, 'contatos', { limit: 5, after: page.seguinte })
  assert.equal(next.kind, 'OK')
  assert.equal(Rows.parse(Object(next).value).linhas[0]?.id, '1005')
})

test('o e-mail e o telefone saem como dado pessoal', async (t) => {
  const on = await portalOn(t)
  for (const read of [
    await on.builderRead(on.carla, 'contatos', { limit: 1 }),
    await on.assistantRead(on.carla, 'contatos', { limit: 1 }),
  ]) {
    assert.equal(read.kind, 'OK')
    const shown = JSON.stringify(read)
    assert.ok(shown.includes(FIRST_CONTACT_EMAIL) && shown.includes(FIRST_CONTACT_PHONE))
  }
  const called = on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED')
  assert.deepEqual(
    called.map(({ fields }) => [fields.operation, fields.personal, fields.withheld]),
    [
      ['contatos', 'contato', ''],
      ['contatos', 'contato', ''],
    ],
  )
  const logged = JSON.stringify(on.hub.lines)
  for (const value of [FIRST_CONTACT_EMAIL, FIRST_CONTACT_PHONE])
    assert.equal(logged.includes(value), false, `the log carries ${value}`)
})

test('o HubSpot que recusa a leitura chega com o status e o corpo', async (t) => {
  const on = await portalOn(t)
  on.fake.switches.readRefused = true
  const refused = await on.builderRead(on.ana, 'contatos', { limit: 1 })
  assert.equal(refused.kind, 'REFUSED')
  const { native } = Object(refused)
  assert.deepEqual(
    [native.status, native.code, native.body.category, native.body.status],
    [403, 'MISSING_SCOPES', 'MISSING_SCOPES', 'error'],
  )
  assert.match(native.message, /granted all required scopes/)
})

test('o 401 marca precisa religar', async (t) => {
  const real = globalThis.fetch
  let expired = false
  const unauthorized = { status: 'error', category: 'EXPIRED_AUTHENTICATION' }
  t.mock.method(globalThis, 'fetch', (input: Request | string | URL, init?: RequestInit) =>
    expired && input instanceof Request && new URL(input.url).pathname.startsWith('/crm/')
      ? Promise.resolve(Response.json(unauthorized, { status: 401 }))
      : real(input, init),
  )
  const on = await portalOn(t)
  expired = true
  const refused = await on.builderRead(on.ana, 'contatos', { limit: 1 })
  assert.equal(refused.kind, 'AUTH_REFUSED')
  assert.equal(on.fake.refreshes(), 1, 'one renewal, then the repeat is refused too')
  const [row] = await on.hub.test.asOwner('select state from connectors.connection')
  assert.deepEqual(row, { state: 'NEEDS_REAUTH' })
})

test('a renovação recusada marca precisa religar', async (t) => {
  const on = await portalOn(t)
  on.fake.expireAccess()
  on.fake.switches.revoke = true
  const refused = await on.builderRead(on.ana, 'contatos', { limit: 1 })
  assert.equal(refused.kind, 'AUTH_REFUSED')
  assert.equal(on.fake.refreshes(), 0)
  const [row] = await on.hub.test.asOwner('select state from connectors.connection')
  assert.deepEqual(row, { state: 'NEEDS_REAUTH' })
})

test('a nota num contato mostra o cartão e sai uma vez', async (t) => {
  const on = await portalOn(t)
  const input = { contactId: '1000', body: 'Ligou pedindo a segunda via.' }
  const approved = on.noteBy(on.ana, input)
  const target = { connectionId: approved.connectionId }
  const card = await on.hub.connectors.assistant.writeOf(approved.scope, {
    ...target,
    operation: 'notaNoContato',
  })
  assert.deepEqual(Object.keys(card?.input.shape ?? {}), ['contactId', 'body'])
  assert.equal(
    await on.hub.connectors.assistant.writeOf(approved.scope, { ...target, operation: 'contatos' }),
    undefined,
  )
  const written = await on.hub.connectors.assistant.write(approved)
  assert.equal(written.kind, 'OK')
  assert.deepEqual(await on.hub.connectors.assistant.write(approved), written)
  assert.equal(on.fake.notes().length, 1, 'the double got the note once')
  const [note] = on.fake.notes()
  assert.match(
    String(Object(note).properties.hs_note_body),
    /^Ligou pedindo a segunda via\. Conexus [0-9a-f]{8}$/,
  )
  assert.deepEqual(Object(note).associations[0].types, [
    { associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 202 },
  ])
  const sent = on.hub.lines.filter((line) => line.message === 'CONNECTOR_WRITE_SENT')
  assert.equal(sent.length, 1)
  assert.equal(sent[0]?.fields.writtenId, '9001')
  assert.equal(JSON.stringify(on.hub.lines).includes('Ligou pedindo'), false)
})

test('o limite por turno conta a chamada do HubSpot', async (t) => {
  const on = await portalOn(t)
  const run = RunId.parse(randomUUID())
  for (let spent = 0; spent < 50; spent += 1)
    assert.equal((await on.builderRead(on.ana, 'contatos', { limit: 1 }, run)).kind, 'OK')
  const reached = on.fake.calls()
  assert.deepEqual(await on.builderRead(on.ana, 'contatos', { limit: 1 }, run), {
    kind: 'CALLS_SPENT',
  })
  assert.equal(on.fake.calls(), reached, 'the 51st never reached HubSpot')
})

test('Desligar apaga a linha sem chamada de revogação', async (t) => {
  const on = await hubspotOn(t)
  const linked = await linkHubspot(on)
  const id = String(Object(linked.json()).connection.id)
  const callsBefore = on.fake.calls()
  const gone = await call(on.hub, on.ana, 'DELETE', `${on.base}/${id}`)
  assert.deepEqual([gone.statusCode, Object(gone.json()).revocation], [200, 'NONE'])
  assert.equal((await on.hub.test.asOwner('select 1 from connectors.connection')).length, 0)
  assert.equal(on.fake.calls(), callsBefore, 'nothing was asked of HubSpot')
})
