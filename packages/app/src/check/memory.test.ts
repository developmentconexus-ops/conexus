import assert from 'node:assert/strict'
import { test } from 'node:test'
import { dependencies } from './dependencies.ts'
import { TYPE_HEAP_MB } from './machine.ts'
import { manifesto } from './manifest.ts'
import { programOf } from './program.ts'
import type { CheckContext } from './step.ts'
import { onTheMachine } from './test-app.ts'
import { tipos } from './types.ts'

const OPERATIONS = `import { defineConnectors, defineOperations } from '@conexus/app'
import { z } from 'zod'

export const connectors = defineConnectors({ sankhya: ['consultar', 'empresas'] })

export const operations = defineOperations({
  curva: { input: z.object({ empresa: z.int() }), output: z.object({ linhas: z.array(z.object({ vendedor: z.string(), total: z.number() })) }) },
})
`

const HANDLERS = `import { connectorsOf, defineHandlers } from '@conexus/app'
import { connectors, operations } from '../shared/operations'

export const handlers = defineHandlers(operations, {
  curva: async ({ empresa }, context) => {
    const answer = await connectorsOf(context, connectors).sankhya.consultar({ sql: \`SELECT 1 FROM TSIEMP WHERE CODEMP = \${empresa}\` })
    return { linhas: answer.kind === 'OK' ? answer.value.linhas.map(() => ({ vendedor: 'x', total: 0 })) : [] }
  },
})
`

// A screen with the weight of the founder's: a form, a table, a chart and a query in one file.
const SCREEN = `import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { api } from '@/conexus/api.gen'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function Home() {
  const form = useForm({ defaultValues: { empresa: 1 } })
  const empresa = form.watch('empresa')
  const curva = useQuery({ queryKey: ['curva', empresa], queryFn: () => api('curva', { empresa }) })
  const linhas = curva.data?.linhas ?? []
  return (
    <Card>
      <CardHeader>
        <CardTitle>Curva ABC</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(() => curva.refetch())}>
          <Button type="submit">Atualizar</Button>
        </form>
        <BarChart width={400} height={200} data={linhas}>
          <XAxis dataKey="vendedor" />
          <YAxis />
          <Bar dataKey="total" />
        </BarChart>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendedor</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((linha: { vendedor: string; total: number }) => (
              <TableRow key={linha.vendedor}>
                <TableCell>{linha.vendedor}</TableCell>
                <TableCell>{linha.total}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
`

// The masking of the founder's first live build (2026-10-31): `tipos` ran in the check's own process
// on Node's default heap of about 430 MB and died with a connector app, and no test ran it that way.
// This one runs the real step, which gives each program the heap the machine has (`TYPE_HEAP_MB`).
test(`tipos confere o app com conectores e uma tela rica no ar de ${TYPE_HEAP_MB} MB que a máquina dá`, async (t) => {
  const ctx = onTheMachine(t, {
    'shared/operations.ts': OPERATIONS,
    'server/handlers.ts': HANDLERS,
    'src/routes/home.tsx': SCREEN,
  })
  assert.equal((await dependencies(ctx)).state, 'passed')
  assert.equal((await manifesto(ctx)).state, 'passed')
  assert.deepEqual(await tipos(ctx), { state: 'passed' })
  // The SDK reaches the program as declarations: one of its sources back in costs every app again.
  for (const name of ['screens', 'server'] as const) {
    const sources = programOf(ctx.root, name)
      .getSourceFiles()
      .map(({ fileName }) => fileName)
      .filter((fileName) => /\/@conexus\//.test(fileName) && !fileName.endsWith('.d.ts'))
    assert.deepEqual(sources, [], `${name}: the SDK reached the program as sources`)
  }
})

test('um programa que esgota o ar é desfecho do passo, com a sua linha, e não um check morto', async (t) => {
  const ctx = onTheMachine(t, {
    'shared/operations.ts': OPERATIONS,
    'server/handlers.ts': HANDLERS,
  })
  const spent: CheckContext = {
    ...ctx,
    run: async () => ({
      code: null,
      output:
        'FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory',
      timedOut: false,
    }),
  }
  assert.deepEqual(await tipos(spent), { state: 'platform', reason: 'tipos ran out of memory' })
})

test('um filho morto sem código nem palavras do V8 é desfecho da plataforma, não falha do app', async (t) => {
  const ctx = onTheMachine(t, {
    'shared/operations.ts': OPERATIONS,
    'server/handlers.ts': HANDLERS,
  })
  const killed: CheckContext = {
    ...ctx,
    run: async () => ({ code: null, output: '', timedOut: false }),
  }
  assert.deepEqual(await tipos(killed), {
    state: 'platform',
    reason: 'tipos ended with no exit code: ',
  })
})

test('o que o filho escreve fora do arquivo de resultado não vira diagnóstico nem estouro de ar', async (t) => {
  const ctx = onTheMachine(t, {
    'shared/operations.ts': OPERATIONS,
    'server/handlers.ts': HANDLERS,
  })
  assert.equal((await dependencies(ctx)).state, 'passed')
  const noisy: CheckContext = {
    ...ctx,
    run: async (command, args, options) => {
      const ran = await ctx.run(command, args, options)
      return { ...ran, output: `(node) warning: heap out of memory is only a word\n${ran.output}` }
    },
  }
  assert.deepEqual(await tipos(noisy), { state: 'passed' })
})
