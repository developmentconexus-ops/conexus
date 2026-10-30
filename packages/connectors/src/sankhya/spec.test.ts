import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { before, describe, it } from 'node:test'
import { z } from 'zod'
import { readToken, tokenRequest } from '../kernel/auth.ts'
import type { Operation, OperationId, ProviderRequest } from '../kernel/operation.ts'
import { requestOf } from '../kernel/operation.ts'
import { fetchText } from '../kernel/page.ts'
import { toRequest } from '../kernel/request.ts'
import { sankhya } from './definition.ts'
import { sankhyaFake } from './fake.ts'
import { downloadSpec, SITE, Spec } from './spec-source.ts'

// The documentation is Sankhya's ("Licença Sankhya") and the repository is public, so none of it is
// kept here. The check reads it when it runs: SANKHYA_SPEC names a file or an address of the cut
// (`node packages/connectors/scripts/sankhya-spec.ts <file>` writes one), and SANKHYA_SPEC_ONLINE=1
// downloads the public pages (CI's own job). With neither, the check is skipped.

const SKIP =
  'opt-in: sem SANKHYA_SPEC nem SANKHYA_SPEC_ONLINE: a conferência com a documentação não rodou'

async function readSpec(): Promise<Spec | null> {
  // biome-ignore lint/style/noProcessEnv: a switch of this one check, not the app's configuration
  const given = process.env.SANKHYA_SPEC
  if (given) {
    const text = /^https?:\/\//.test(given) ? await fetchText(given) : readFileSync(given, 'utf8')
    return Spec.parse(JSON.parse(text))
  }
  // biome-ignore lint/style/noProcessEnv: a switch of this one check, not the app's configuration
  return process.env.SANKHYA_SPEC_ONLINE === '1' ? downloadSpec() : null
}

/** `queried` is every key of the input that `request` puts in the query, not only the ones the probe sends. */
type Sample = { id: OperationId; request: ProviderRequest; queried: string[] }

/** The route of a request: a literal path before one with `{param}`, a parameter standing for one segment. */
function routeOf(spec: Spec, request: ProviderRequest) {
  const entries = Object.entries(spec.routes).filter(([key]) =>
    key.startsWith(`${request.method} `),
  )
  const segments = request.path.split('/')
  const matching = entries.filter(([key]) => {
    const parts = key.slice(request.method.length + 1).split('/')
    return (
      parts.length === segments.length &&
      parts.every((part, index) => part.startsWith('{') || part === segments[index])
    )
  })
  return matching.find(([key]) => !key.includes('{')) ?? matching[0]
}

/**
 * What the documentation says is wrong with one request. Its 200 schema is not checked: the real
 * gateway answers in other shapes (another list key, numbers as text, one object for a list of one;
 * measured 2026-10-30), and the double follows the gateway.
 */
function problemsOf(spec: Spec, sample: Sample): string[] {
  const found = routeOf(spec, sample.request)
  if (!found)
    return [
      `${sample.id}: ${sample.request.method} ${sample.request.path} is not a documented route`,
    ]
  const [key, route] = found
  const problems = [...new Set([...Object.keys(sample.request.query), ...sample.queried])]
    .filter((name) => !route.query.includes(name))
    .map((name) => `${sample.id}: ${key} declares no query parameter ${name}`)
  return problems
}

/** The keys of an operation's input that its request sends in the query, each tried on its own beside the probe's input. */
function queriedKeys(operation: Operation<unknown, unknown>, probe: unknown): string[] {
  const names = Object.keys(z.toJSONSchema(operation.input, { io: 'input' }).properties ?? {})
  return names.filter(
    (name) =>
      name in
      operation.request({ ...z.looseObject({}).parse(probe), [name]: '1' }, { ref: null }).query,
  )
}

/** The probes in order, as the conformance runs them, against the fake. */
async function samples(): Promise<Sample[]> {
  const fake = sankhyaFake()
  const login = await fake.handle(
    toRequest(sankhya, tokenRequest(sankhya.auth, fake.credential), null),
  )
  const token = readToken(sankhya.auth, { status: login.status, body: await login.json() })
  assert.equal(token.kind, 'OK')
  if (token.kind !== 'OK') return []
  const earlier = new Map<OperationId, unknown>()
  const out: Sample[] = []
  for (const operation of sankhya.operations) {
    const input = operation.probe(earlier)
    assert.notEqual(input, null, operation.id)
    const request = requestOf(operation, input, { ref: null })
    const response = await fake.handle(toRequest(sankhya, request, token.accessToken))
    const body = z.unknown().parse(await response.json())
    const answered = operation.answer({ status: response.status, body })
    if (answered.kind === 'OK') earlier.set(operation.id, answered.value)
    out.push({ id: operation.id, request, queried: queriedKeys(operation, input) })
  }
  return out
}

describe('a documentação do Sankhya', () => {
  // Read once for the whole file (the online source takes a minute); a failed read fails the hook.
  let loaded: Spec | null = null
  before(async () => {
    loaded = await readSpec()
  })

  it('baixou', (t) => {
    const spec = loaded
    if (!spec) return t.skip(SKIP)
    assert.ok(Object.keys(spec.routes).length > 0, `a documentação do Sankhya não baixou (${SITE})`)
  })

  it('cada leitura confere com a documentação do Sankhya', async (t) => {
    const spec = loaded
    if (!spec) return t.skip(SKIP)
    const all = await samples()
    assert.deepEqual(
      all.flatMap((sample) => problemsOf(spec, sample)),
      [],
    )
    const used = new Set(all.flatMap((sample) => routeOf(spec, sample.request)?.[0] ?? []))
    assert.deepEqual(
      Object.keys(spec.routes).filter((key) => !used.has(key)),
      [],
      'rota sem operação',
    )
  })

  it('recusa a rota que não existe e o filtro que a rota não declara', async (t) => {
    const spec = loaded
    if (!spec) return t.skip(SKIP)
    const all = await samples()
    const clientes = all.find((sample) => sample.id === 'clientes')
    assert.ok(clientes)
    const moved = { ...clientes.request, path: '/v1/parceiros/clientes-x' as const }
    assert.equal(problemsOf(spec, { ...clientes, request: moved }).length, 1)
    const extra = { ...clientes.request, query: { ...clientes.request.query, bogus: '1' } }
    assert.equal(problemsOf(spec, { ...clientes, request: extra }).length, 1)
    assert.equal(problemsOf(spec, { ...clientes, queried: ['dataInicio'] }).length, 1)
  })
})
