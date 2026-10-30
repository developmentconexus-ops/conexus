import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  CALLER,
  EXAMPLE_CALL,
  edge,
  pageText,
  problem,
  SESSION,
  VERSION_CALL,
} from './test-edge.ts'

const LIVE = { Cookie: `__Host-conexus-app=${SESSION}` }

test('sem versão no ar: o exemplo, com props só caller, sem o que mais o Hub disser', async () => {
  const door = edge({
    hub: () =>
      Response.json({
        ...EXAMPLE_CALL,
        caller: { ...CALLER, email: 'ana@example.com', role: 'OWNER' },
        companyId: 'c1',
      }),
  })
  await door.fetch('/', { headers: LIVE })
  const [call] = door.appCalls
  assert.equal(call?.name, 'conexus-example')
  assert.deepEqual(call?.args, { props: { caller: CALLER } })
  assert.deepEqual(call?.options, { outbound: {}, limits: { subRequests: 50, cpuMs: 50 } })
  assert.deepEqual(door.dbBindings, [])
})

test('versão no ar: o Worker dela, com props só caller, db e connectors, e o db preso ao login de execução', async () => {
  const door = edge({ hub: () => Response.json(VERSION_CALL) })
  const response = await door.fetch('/', { headers: LIVE })
  assert.equal(response.status, 200)
  const [call] = door.appCalls
  assert.equal(call?.name, VERSION_CALL.version.worker)
  assert.deepEqual(Object.keys(call?.args.props ?? {}), ['caller', 'db', 'connectors'])
  assert.deepEqual(
    door.dbBindings.map(({ endsAt: _endsAt, ...login }) => login),
    [VERSION_CALL.database],
  )
})

test('até a porta dos conectores, toda chamada do app a um conector é NOT_GRANTED e não há ligação', async () => {
  const door = edge({ hub: () => Response.json(VERSION_CALL) })
  await door.fetch('/', { headers: LIVE })
  const connectors = door.appCalls[0]?.args.props.connectors
  assert.ok(connectors)
  assert.deepEqual(await connectors.call('sankhya', 'pedidos', { codigoEmpresa: 1, page: 0 }), {
    kind: 'NOT_GRANTED',
  })
  assert.deepEqual(await connectors.connections('mercado-livre'), [])
  assert.equal(door.hubCalls.length, 1, 'no call reached the Hub but the session check')
})

test('versão no ar cujo Worker sumiu: a 502 da etapa 8, nunca o exemplo', async () => {
  const door = edge({ hub: () => Response.json(VERSION_CALL), missingScript: true })
  const response = await door.fetch('/', { headers: LIVE })
  assert.equal(response.status, 502)
  assert.equal(await pageText(response), '<h1>O app não conseguiu responder agora.</h1>')
  assert.equal(door.appCalls.length, 0)
})

test('o app não publicado tem a sua página: 404, sem chamar Worker algum', async () => {
  const door = edge({ hub: () => problem('APP_NOT_PUBLISHED') })
  const response = await door.fetch('/', { headers: LIVE })
  assert.equal(response.status, 404)
  assert.equal(await pageText(response), '<h1>Este app ainda não foi publicado.</h1>')
  assert.equal(door.appCalls.length, 0)
})
