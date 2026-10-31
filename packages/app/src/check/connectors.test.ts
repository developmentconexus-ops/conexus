import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { dependencies } from './dependencies.ts'
import { manifesto } from './manifest.ts'
import { workOf } from './step.ts'
import { ANY_HANDLERS, appWith, contextOf, onTheMachine } from './test-app.ts'
import { tipos } from './types.ts'

const CONNECTED = `import { defineConnectors, defineOperations } from '@conexus/app'
import { z } from 'zod'

export const connectors = defineConnectors({ sankhya: ['consultar', 'pedidos'], 'mercado-livre': ['perguntas'] })

export const operations = defineOperations({ contar: { input: z.object({}), output: z.unknown() } })
`

const CONNECTED_HANDLERS = `import { connectorsOf, defineHandlers } from '@conexus/app'
import { connectors, operations } from '../shared/operations'

export const handlers = defineHandlers(operations, {
  contar: (_input, context) => connectorsOf(context, connectors).sankhya.consultar({ sql: 'SELECT 1 FROM TSIEMP' }),
})
`

test('os conectores declarados vão ao manifesto, e o handler os chama tipado pelo kit que a máquina recebe', async (t) => {
  const ctx = onTheMachine(t, {
    'shared/operations.ts': CONNECTED,
    'server/handlers.ts': CONNECTED_HANDLERS,
  })
  assert.equal((await dependencies(ctx)).state, 'passed')
  assert.equal((await manifesto(ctx)).state, 'passed')
  const manifest = JSON.parse(readFileSync(workOf(ctx, 'manifest.json'), 'utf8'))
  assert.deepEqual(manifest.connectors, [
    { connector: 'sankhya', operations: ['consultar', 'pedidos'] },
    { connector: 'mercado-livre', operations: ['perguntas'] },
  ])
  assert.deepEqual(await tipos(ctx), { state: 'passed' })
  const wrong = onTheMachine(t, {
    'shared/operations.ts': CONNECTED,
    'server/handlers.ts': CONNECTED_HANDLERS.replace('consultar(', 'clientes('),
  })
  assert.equal((await dependencies(wrong)).state, 'passed')
  const undeclared = await tipos(wrong)
  assert.equal(undeclared.state, 'failed')
  assert.deepEqual(
    undeclared.problems?.map(({ code, file }) => [code, file]),
    [['TS2339', 'server/handlers.ts']],
  )
  const empty = contextOf(
    appWith(t, {
      'shared/operations.ts': CONNECTED.replace("['consultar', 'pedidos']", '[]'),
      'server/handlers.ts': ANY_HANDLERS,
    }),
  )
  const refused = await manifesto(empty)
  assert.equal(refused.state, 'failed')
  assert.equal(refused.problems[0]?.code, 'MANIFEST_INVALID')
})
