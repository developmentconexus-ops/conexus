import { setTimeout as sleep } from 'node:timers/promises'
import { z } from 'zod'
import { fetchText } from '../kernel/page.ts'

// Sankhya's public documentation pages, read at run time and never kept: the cut they give is
// Sankhya's ("Licença Sankhya"), so nothing of it is committed, cached or uploaded. Only the
// public pages are fetched; no Sankhya API is called.

export const SITE = 'https://developer.sankhya.com.br/reference'
const SECONDS_BETWEEN_PAGES = 3

/** One documentation page per route the ready operations use. */
const PAGES = [
  'get_v1-empresas',
  'getpedidos',
  'get_v1-produtos',
  'getcliente',
  'get_v1-vendedores',
  'get_v1-tipos-operacao',
  'get_v1-naturezas',
  'get_v1-centros-resultado',
  'get_v1-grupos-produto',
  'getnfe',
  'getnfebycodigo',
  'getnfedevolucoes',
  'getnfecanceladas',
  'getestoqueprodutos',
  'get_v1-estoque-locais',
  'getfinanceiros',
  'getfinanceirosdespesas',
  'get_v1-financeiros-tipos-pagamento',
  'getprecoproduto',
  'getprecotabela',
  'gettransportadoras',
  'getordenscarga',
]

const Json = z.record(z.string(), z.unknown())
const Parameter = z.object({ name: z.string(), in: z.string() })
const Method = z.object({ parameters: z.array(Parameter).default([]) })
const Page = z.object({
  paths: z.record(z.string(), z.object({ get: Method })),
})

function openApiOf(markdown: string): unknown {
  const after = markdown.split('# OpenAPI definition')[1] ?? ''
  const block = after.match(/```json\n([\s\S]*?)\n```/)
  if (!block?.[1]) throw new Error('no OpenAPI block')
  // biome-ignore lint/plugin: the parsed document goes straight to the page schema below (C27)
  return JSON.parse(block[1])
}

/** The schema with its `$ref`s resolved, `nullable` as a null branch, and the prose and examples gone. */
function resolve(schema: unknown, root: unknown, seen: readonly string[] = []): unknown {
  if (Array.isArray(schema)) return schema.map((item) => resolve(item, root, seen))
  const object = Json.safeParse(schema)
  if (!object.success) return schema
  const ref = z.string().safeParse(object.data.$ref)
  if (ref.success) {
    if (seen.includes(ref.data)) return {}
    const target = ref.data
      .slice(2)
      .split('/')
      .reduce<unknown>((node, key) => Json.parse(node)[key], root)
    return resolve(target, root, [...seen, ref.data])
  }
  const kept = Object.entries(object.data)
    .filter(([key]) => !['example', 'examples', 'description', 'nullable'].includes(key))
    .map(([key, value]) => [
      key,
      key === 'properties' ? resolveEach(value, root, seen) : resolve(value, root, seen),
    ])
  const plain = Object.fromEntries(kept)
  return object.data.nullable === true ? { anyOf: [plain, { type: 'null' }] } : plain
}

function resolveEach(properties: unknown, root: unknown, seen: readonly string[]): unknown {
  return Object.fromEntries(
    Object.entries(Json.parse(properties)).map(([name, value]) => [
      name,
      resolve(value, root, seen),
    ]),
  )
}

const Route = z.object({
  page: z.string(),
  query: z.array(z.string()),
})
export const Spec = z.object({
  source: z.string(),
  fetchedAt: z.string(),
  license: z.string(),
  routes: z.record(z.string(), Route),
})
export type Spec = z.infer<typeof Spec>

/** The cut of the documentation the ready operations use: one page per route, 3 s apart. */
export async function downloadSpec(): Promise<Spec> {
  const routes: Record<string, z.infer<typeof Route>> = {}
  for (const page of PAGES) {
    const document = Json.parse(openApiOf(await fetchText(`${SITE}/${page}.md`)))
    const parsed = Page.parse({ paths: resolve(document.paths, document) })
    for (const [path, item] of Object.entries(parsed.paths)) {
      routes[`GET ${path}`] = {
        page,
        query: item.get.parameters.filter((p) => p.in === 'query').map((p) => p.name),
      }
    }
    await sleep(SECONDS_BETWEEN_PAGES * 1000)
  }
  return { source: SITE, fetchedAt: new Date().toISOString(), license: 'Licença Sankhya', routes }
}
