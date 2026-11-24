import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import type { TestContext } from 'node:test'
import { STARTER_DIR } from '../starter.ts'
import { browseInChromium } from './browser.ts'
import { spawnRunner } from './command.ts'
import { declare } from './declarations.ts'
import type { CheckContext, Runner } from './step.ts'

// The repository's node_modules holds every package of the starter at its exact version, so a
// copy of the starter that links to it is an app after `npm ci`. The install itself reaches the
// registry, which no test may (testing T14): it is the one command faked here, and recorded.
export const MODULES = join(resolve(import.meta.dirname, '../../../..'), 'node_modules')

export type Files = Readonly<Record<string, string | null>>

export function appWith(t: TestContext, files: Files): string {
  const root = mkdtempSync(join(tmpdir(), 'conexus-check-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  cpSync(STARTER_DIR, root, { recursive: true, filter: (path) => !path.includes('node_modules') })
  mkdirSync(join(root, 'node_modules'))
  for (const name of readdirSync(MODULES)) {
    if (name !== '.conexus') symlinkSync(join(MODULES, name), join(root, 'node_modules', name))
  }
  for (const [path, text] of Object.entries(files)) {
    rmSync(join(root, path), { force: true })
    if (text === null) continue
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}

export function contextOf(root: string, installs: string[][] = []): CheckContext {
  const run: Runner = async (command, args, options) => {
    if (command !== 'npm') return spawnRunner(command, args, options)
    installs.push([command, ...args])
    return { code: 0, output: '', timedOut: false }
  }
  return {
    root,
    tools: MODULES,
    platform: undefined,
    run,
    browse: browseInChromium,
  }
}

// Every handler answers the same: the manifesto step starts the runtime, never calls them.
export const ANY_HANDLERS = `import { operations } from '../shared/operations'

export const handlers = Object.fromEntries(Object.keys(operations).map((name) => [name, () => ({})]))
`

/** The platform's folder as the template builds it: the SDK copied and built into declarations (check/declarations.ts). */
export function builtPlatform(t: TestContext): string {
  const opt = mkdtempSync(join(tmpdir(), 'conexus-platform-'))
  t.after(() => rmSync(opt, { recursive: true, force: true }))
  const platform = join(opt, 'packages')
  for (const folder of ['app', 'app-contract', 'connectors'])
    cpSync(join(MODULES, '..', 'packages', folder), join(platform, folder), {
      recursive: true,
      filter: (path) => !path.includes('node_modules'),
    })
  // The template's /opt/conexus/node_modules: the packages' libraries, and the workspace's links.
  mkdirSync(join(opt, 'node_modules', '@conexus'), { recursive: true })
  for (const name of readdirSync(MODULES))
    if (name !== '@conexus' && name !== '.conexus')
      symlinkSync(join(MODULES, name), join(opt, 'node_modules', name))
  for (const folder of ['app', 'app-contract', 'connectors'])
    symlinkSync(join(platform, folder), join(opt, 'node_modules', '@conexus', folder))
  declare(platform)
  return platform
}

/** The app as the machine has it: the SDK from the built platform's folder, never the repository's links. */
export function onTheMachine(t: TestContext, files: Files): CheckContext {
  const root = appWith(t, files)
  unlinkSync(join(root, 'node_modules', '@conexus'))
  return { ...contextOf(root), platform: builtPlatform(t) }
}

const ENCOMENDAS_OPERATIONS = `import { defineOperations } from '@conexus/app'
import { z } from 'zod'

export const operations = defineOperations({
  listarEncomendas: {
    input: z.object({}),
    output: z.array(z.object({ id: z.number(), cliente: z.string() })),
  },
})
`

const ENCOMENDAS_HANDLERS = `import { defineHandlers, query } from '@conexus/app'
import { z } from 'zod'
import { operations } from '../shared/operations'

const Encomenda = z.object({ id: z.number(), cliente: z.string() })

export const handlers = defineHandlers(operations, {
  listarEncomendas: (_input, { db }) => query(db, Encomenda, 'select id, cliente from encomenda order by id'),
})
`

const ENCOMENDAS_SCREEN = `import { useQuery } from '@tanstack/react-query'
import { api } from '@/conexus/api.gen'

export function Home() {
  const lista = useQuery({
    queryKey: ['listarEncomendas'],
    queryFn: () => api('listarEncomendas', {}),
    retry: false,
  })
  if (lista.isPending) return <p>Carregando</p>
  if (lista.isError) return <p role="alert">Erro ao carregar</p>
  return (
    <ul>
      {lista.data.map((encomenda) => (
        <li key={encomenda.id}>{encomenda.cliente}</li>
      ))}
    </ul>
  )
}
`

/** The app a Builder is asked to check, with its defect planted: `listarEncomendas` is declared and typed, and its handler reads `encomenda`, which no migration creates. */
export const ENCOMENDAS_DEFEITO: Files = {
  'shared/operations.ts': ENCOMENDAS_OPERATIONS,
  'server/handlers.ts': ENCOMENDAS_HANDLERS,
  'src/routes/home.tsx': ENCOMENDAS_SCREEN,
}

const CONECTOR_OPERATIONS = `import { defineConnectors, defineOperations } from '@conexus/app'
import { z } from 'zod'

export const connectors = defineConnectors({ sankhya: ['consultar'] })

export const operations = defineOperations({
  listarPedidos: {
    input: z.object({}),
    output: z.discriminatedUnion('estado', [
      z.object({ estado: z.literal('OK'), pedidos: z.int() }),
      z.object({ estado: z.literal('SEM_CONEXAO') }),
    ]),
  },
})
`

const CONECTOR_HANDLERS = `import { connectorsOf, defineHandlers } from '@conexus/app'
import { connectors, operations } from '../shared/operations'

export const handlers = defineHandlers(operations, {
  listarPedidos: async (_input, context) => {
    const lido = await connectorsOf(context, connectors).sankhya.consultar({ sql: 'SELECT 1 FROM TSIEMP' })
    if (lido.kind === 'NOT_GRANTED') return { estado: 'SEM_CONEXAO' as const }
    if (lido.kind === 'OK') return { estado: 'OK' as const, pedidos: lido.value.linhas.length }
    throw new Error('CONECTOR_FALHOU')
  },
})
`

const CONECTOR_SCREEN = `import { useQuery } from '@tanstack/react-query'
import { api } from '@/conexus/api.gen'

export function Home() {
  const lista = useQuery({
    queryKey: ['listarPedidos'],
    queryFn: () => api('listarPedidos', {}),
    retry: false,
  })
  if (lista.isPending) return <p>Carregando</p>
  if (lista.isError) return <p role="alert">Erro ao carregar</p>
  if (lista.data.estado === 'SEM_CONEXAO') return <p>Sem conexão</p>
  return <p>{lista.data.pedidos} pedidos</p>
}
`

/** An app whose entry screen reads a connector: with none connected it shows `Sem conexão`, and that is no defect. */
export const CONECTOR_NA_ENTRADA: Files = {
  'shared/operations.ts': CONECTOR_OPERATIONS,
  'server/handlers.ts': CONECTOR_HANDLERS,
  'src/routes/home.tsx': CONECTOR_SCREEN,
}
