import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { connectorOf } from '@conexus/connectors'
import { APP_SESSION_HEADER, CompanyId, PersonId, ProjectId, RunId } from '@conexus/hub-api'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import { opened } from '../apps/test-conference.ts'
import { PEDIDOS_PREVIA, sessionOf } from '../apps/test-handoff.ts'
import { folder } from '../apps/test-versions.ts'
import { call } from '../identity/test-hub.ts'
import { appCalls, READS, readOf, sankhyaDoor } from './test-app-calls.ts'
import { testOf } from './test-connections.ts'

test('a porta da borda: com sessão e a ligação liberada o app lê e recebe OK com as linhas', async (t) => {
  const on = await appCalls(t)
  await on.connect('Matriz')
  const read = await on.read()
  assert.equal(read.statusCode, 200, read.body)
  const answer = Object(read.json())
  assert.equal(answer.kind, 'OK')
  assert.ok(Array.isArray(answer.value.linhas) && answer.value.linhas.length > 0)
  const names = await on.hub.edge.inject({
    method: 'GET',
    url: '/api/app-connector-calls/connections?host=pedidos--empresa-a&connector=sankhya',
    headers: { 'x-conexus-app-session': on.session },
  })
  assert.deepEqual(names.json(), { names: ['Matriz'] })
})

test('o host diz o manifesto: no da Prévia, o da versão da Prévia; no do app, o da publicada', async (t) => {
  const on = await appCalls(t, { declared: [] })
  await on.connect('Matriz')
  const preview = randomUUID().replaceAll('-', '')
  await on.hub.test.asOwner(
    `insert into apps.app_version (id, company_id, project_id, number, state, manifest, digest,
       sent_by, attempt_key, created_at)
     values ($1, $2, $3, 2, 'ready', $4::jsonb, repeat('0', 64), $5, $1, now())`,
    [
      preview,
      on.companyId,
      on.projectId,
      JSON.stringify(folder({ connectors: READS }).manifest),
      on.ana.id,
    ],
  )
  await on.hub.test.asOwner('update apps.app set live_version_id = $1 where project_id = $2', [
    preview,
    on.projectId,
  ])
  const session = await sessionOf(on.hub, on.ana, PEDIDOS_PREVIA)
  const inPreview = await on.read({ host: PEDIDOS_PREVIA }, { [APP_SESSION_HEADER]: session })
  assert.equal(inPreview.statusCode, 200, inPreview.body)
  assert.equal(Object(inPreview.json()).kind, 'OK')
  assert.deepEqual((await on.read()).json(), { kind: 'NOT_GRANTED' })
})

test('toda recusa de admissão é a mesma NOT_GRANTED', async (t) => {
  const on = await appCalls(t, { declared: [{ connector: 'sankhya', operations: ['empresas'] }] })
  const id = await on.connect('Matriz', false)
  const refused = []
  refused.push(await on.read())
  assert.equal((await call(on.hub, on.ana, 'PUT', on.routes.grant(id))).statusCode, 200)
  refused.push(await on.read({ operation: 'clientes' }))
  refused.push(await on.read({ operation: 'inexistente' }))
  refused.push(await on.read({ connection: 'Outra' }))
  refused.push(await on.read({ connector: 'mercado-livre' }))
  await on.hub.test.asOwner("update connectors.connection set state = 'NEEDS_REAUTH'")
  refused.push(await on.read())
  for (const response of refused) {
    assert.equal(response.statusCode, 200)
    assert.deepEqual(response.json(), { kind: 'NOT_GRANTED' })
  }
})

test('só leitura: uma operação que não é read nunca é lida pela porta', () => {
  const sankhya = connectorOf('sankhya')
  const empresas = sankhya?.operations.find((operation) => operation.id === 'empresas')
  assert.ok(sankhya && empresas)
  const withWrite = { ...sankhya, operations: [{ ...empresas, class: 'write' as const }] }
  assert.equal(readOf(withWrite, 'empresas'), undefined)
  assert.equal(readOf(sankhya, 'empresas')?.id, 'empresas')
})

test('só leitura nas duas portas: uma operação de escrita no kit nunca é lida, pelo app nem pelo Builder', async (t) => {
  const on = await appCalls(t)
  await on.connect('Matriz')
  const sankhya = connectorOf('sankhya')
  const index = sankhya?.operations.findIndex((operation) => operation.id === 'empresas') ?? -1
  const original = sankhya?.operations[index]
  assert.ok(sankhya && original)
  Reflect.set(sankhya.operations, index, { ...original, class: 'write' })
  t.after(() => Reflect.set(sankhya.operations, index, original))
  assert.deepEqual((await on.read()).json(), { kind: 'NOT_GRANTED' })
  const ids = {
    ...{ companyId: CompanyId.parse(on.companyId), projectId: ProjectId.parse(on.projectId) },
    personId: PersonId.parse(on.ana.id),
  }
  const [granted] = await on.hub.connectors.builder.granted(ids)
  assert.ok(granted)
  const built = await on.hub.connectors.builder.read(ids, {
    connectionId: granted.connectionId,
    personId: PersonId.parse(on.ana.id),
    runId: RunId.parse(randomUUID()),
    operation: 'empresas',
    input: { page: 0 },
  })
  assert.equal(built.kind, 'NOT_GRANTED')
})

test('o Builder segue a regra das outras portas: a ligação liberada que deixou de funcionar sai do que ele lê, e volta quando funciona', async (t) => {
  const on = await appCalls(t)
  const id = await on.connect('Matriz')
  const ids = {
    ...{ companyId: CompanyId.parse(on.companyId), projectId: ProjectId.parse(on.projectId) },
    personId: PersonId.parse(on.ana.id),
  }
  assert.equal((await on.hub.connectors.builder.granted(ids)).length, 1)
  await on.hub.test.asOwner("update connectors.connection set state = 'NEEDS_REAUTH'")
  assert.deepEqual(await on.hub.connectors.builder.granted(ids), [])
  assert.equal(
    Object((await testOf(on.hub, on.ana, on.routes.connections, id)).json()).result,
    'WORKING',
  )
  assert.equal((await on.hub.connectors.builder.granted(ids)).length, 1)
})

test('o app recebe só status, código e mensagem da recusa do sistema, nunca o corpo (C51)', async (t) => {
  const on = await appCalls(t)
  await on.connect('Matriz')
  on.fake.switches.refuse.add('empresas')
  const read = await on.read()
  assert.equal(read.statusCode, 200, read.body)
  const answer = Object(read.json())
  assert.equal(answer.kind, 'REFUSED')
  assert.deepEqual(Object.keys(answer.native).sort(), ['code', 'message', 'status'])
  assert.deepEqual(answer.native, { status: 403, code: 'NO_ACCESS', message: 'Sem permissão' })
})

test('o app lê como o Projeto: a dona da sessão sem empresas no papel ainda recebe OK', async (t) => {
  const on = await appCalls(t, { declared: [{ connector: 'sankhya', operations: ['empresas'] }] })
  await on.connect('Matriz')
  const narrowed = await call(
    on.hub,
    on.ana,
    'PUT',
    `/api/companies/${on.companyId}/roles/member`,
    {
      connectors: { sankhya: ['pedidos'] },
      unattended: false,
    },
  )
  assert.equal(narrowed.statusCode, 200, narrowed.body)
  await on.hub.test.asOwner(
    "update auth.member set role = 'member' where company_id = $1 and user_id = $2",
    [on.companyId, on.ana.id],
  )
  const read = await on.read()
  assert.equal(read.statusCode, 200, read.body)
  assert.equal(Object(read.json()).kind, 'OK')
})

test('na conferência o app recebe NOT_GRANTED e nenhuma conexão, sem chamar o conector; a mesma pessoa na Prévia segue lendo', async (t) => {
  const door = sankhyaDoor(t)
  const on = await appCalls(t, { through: door.through })
  await on.connect('Matriz')
  const [neonProject] = on.hub.neon.projects()
  assert.ok(neonProject)
  on.hub.neon.ownedBy(neonProject.id, await createCompanyDatabase(t))
  const { session } = await opened(on, on.ana)
  const release = door.hold()
  const inCheck = { [APP_SESSION_HEADER]: session }
  assert.deepEqual((await on.read({}, inCheck)).json(), { kind: 'NOT_GRANTED' })
  const names = await on.hub.edge.inject({
    method: 'GET',
    url: '/api/app-connector-calls/connections?host=pedidos--empresa-a&connector=sankhya',
    headers: inCheck,
  })
  assert.deepEqual(names.json(), { names: [] })
  assert.equal(door.open(), 0)
  release()
  const previa = await sessionOf(on.hub, on.ana, PEDIDOS_PREVIA)
  const read = await on.read({ host: PEDIDOS_PREVIA }, { [APP_SESSION_HEADER]: previa })
  assert.equal(Object(read.json()).kind, 'OK', read.body)
})
