import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CALLER, EXAMPLE_CALL, edge, pageText, SESSION, VERSION_CALL } from './test-edge.ts'

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
  assert.deepEqual(call?.options, { outbound: {} })
  assert.deepEqual(door.dbBindings, [])
})

test('versão no ar: o Worker dela, com props só caller e db, e o db preso ao login de execução', async () => {
  const door = edge({ hub: () => Response.json(VERSION_CALL) })
  const response = await door.fetch('/', { headers: LIVE })
  assert.equal(response.status, 200)
  const [call] = door.appCalls
  assert.equal(call?.name, VERSION_CALL.version.worker)
  assert.deepEqual(Object.keys(call?.args.props ?? {}), ['caller', 'db'])
  assert.deepEqual(door.dbBindings, [VERSION_CALL.database])
})

test('versão no ar cujo Worker sumiu: a 502 da etapa 8, nunca o exemplo', async () => {
  const door = edge({ hub: () => Response.json(VERSION_CALL), missingScript: true })
  const response = await door.fetch('/', { headers: LIVE })
  assert.equal(response.status, 502)
  assert.equal(await pageText(response), '<h1>O app não conseguiu responder agora.</h1>')
  assert.equal(door.appCalls.length, 0)
})
