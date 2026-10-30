import type { Context } from '@conexus/app-contract'
import { z } from 'zod'
import { connectorsOf, defineConnectors, defineHandlers, defineOperations } from './index.ts'

const operations = defineOperations({
  escrever: { input: z.object({ texto: z.string() }), output: z.object({ id: z.int() }) },
})

// Never run: `npm run typecheck` fails if a handler's types stop following its operation's Zod.
export const handlers = defineHandlers(operations, {
  // @ts-expect-error: the input is `{ texto: string }`, not `{ nome: string }`.
  escrever: ({ nome }: { nome: string }) => ({ id: nome.length }),
})

export const returning = defineHandlers(operations, {
  // @ts-expect-error: the output is `{ id: number }`, not `{ codigo: number }`.
  escrever: () => ({ codigo: 1 }),
})

export const missing = defineHandlers(
  operations,
  // @ts-expect-error: every declared operation needs its handler.
  {},
)

const declared = defineConnectors({
  sankhya: ['consultar', 'pedidos'],
  'mercado-livre': ['perguntas'],
})

// Never run: the calls a handler writes, typed by the kit's reads and by what the app declared.
export async function reads(context: Context) {
  const connectors = connectorsOf(context, declared)
  const counted = await connectors.sankhya.consultar({ sql: 'SELECT 1 FROM TSIEMP' })
  if (counted.kind === 'OK')
    counted.value.linhas satisfies readonly Readonly<Record<string, unknown>>[]
  // @ts-expect-error: `dataInicial` is no field of pedidos, which needs the company code and the page.
  await connectors.sankhya.pedidos({ dataInicial: 1 })
  // @ts-expect-error: the kit has no such read.
  await connectors.sankhya.inexistente()
  // @ts-expect-error: a read of the kit the app did not declare is not in its client.
  await connectors.sankhya.clientes({ codigoEmpresa: 1, page: 0 })
  const [loja] = await connectors['mercado-livre'].connections()
  if (loja !== undefined)
    await connectors['mercado-livre'].perguntas({ offset: 0, limit: 50 }, loja)
  // @ts-expect-error: a connector that allows many connections is told which one.
  await connectors['mercado-livre'].perguntas({ offset: 0, limit: 50 })
  // @ts-expect-error: Sankhya reads one connection per Projeto, so it takes no name and lists none.
  await connectors.sankhya.connections()
}
