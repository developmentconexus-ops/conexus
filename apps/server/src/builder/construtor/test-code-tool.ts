import assert from 'node:assert/strict'
import { CodeSaveResult } from '@conexus/hub-api'
import { tool } from '../../harness/routes/test-questions.ts'
import type { Step } from './test-construtor.ts'
import { listOf, resultOf } from './test-construtor.ts'

/** The tool's code: counts the rows the read answers, as a Worker module of the platform. */
export const SOURCE = `import { z } from 'zod'

export const input = z.object({ mes: z.string() })
export const output = z.object({ total: z.number() })

type Data = { read(operation: string, input: unknown): Promise<unknown> }

export default {
  async fetch(request: Request, _env: unknown, ctx: { props: { data: Data } }) {
    const { mes } = input.parse(await request.json())
    const lido = z.object({ linhas: z.array(z.unknown()) }).parse(
      await ctx.props.data.read('pedidos', { mes }),
    )
    return Response.json(output.parse({ total: lido.linhas.length }))
  },
}
`

export const TEST = `import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import tool from './tool.ts'

const fixtures = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'))

test('conta as linhas lidas', async () => {
  const ctx = { props: { data: { read: async (operation: string) => fixtures[operation] } } }
  const request = new Request('http://tool/', { method: 'POST', body: JSON.stringify({ mes: '2026-09' }) })
  const answer = await tool.fetch(request, {}, ctx)
  const body = await answer.json()
  assert.equal(body.total, fixtures.pedidos.linhas.length)
})
`

export const FAILING = TEST.replace(
  'fixtures.pedidos.linhas.length',
  'fixtures.pedidos.linhas.length + 1',
)

export function saving(connectionId: string, change: object = {}) {
  return {
    slug: 'vendas_por_vendedor',
    connectionId,
    reads: ['pedidos'],
    description: 'Soma as vendas de cada vendedor num mês.',
    source: SOURCE,
    test: TEST,
    samples: { pedidos: { codigoEmpresa: 1, page: 1 } },
    ...change,
  }
}

export function answerOf(answers: Record<string, unknown>[], at = 0) {
  return CodeSaveResult.parse(answers[at])
}

/** The Matriz as the model learns it: the ready read of pedidos that tool_search shows. */
export function matrizOf(asked: Parameters<Step>[0]) {
  const orders = listOf(resultOf(asked).ready).find((each) => each.operation === 'pedidos')
  assert.ok(orders, 'a ready read of pedidos')
  return String(orders.connectionId)
}

/** The model searches the library, then saves what `change` says on the connection the search showed. */
export function searching(known: { matriz: string }, change: object = {}): Step[] {
  return [
    () => [tool('tool_search', {})],
    (asked) => {
      known.matriz = matrizOf(asked)
      return [tool('tool_code_save', saving(known.matriz, change))]
    },
  ]
}
