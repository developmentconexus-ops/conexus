import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { z } from 'zod'
import { readToken, tokenRequest } from '../kernel/auth.ts'
import type { OperationId, ProviderRequest } from '../kernel/operation.ts'
import { requestOf } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { sankhya } from './definition.ts'
import { sankhyaFake } from './fake.ts'
import { downloadSpec, SITE, Spec } from './spec-source.ts'

// The documentation is Sankhya's ("Licença Sankhya") and the repository is public, so none of it is
// kept here. The check reads it when it runs: SANKHYA_SPEC names a file or an address of the cut
// (`node packages/connectors/scripts/sankhya-spec.ts <file>` writes one), and SANKHYA_SPEC_ONLINE=1
// downloads the public pages (CI's own job). With neither, the check is skipped.

const SKIP = 'sem SANKHYA_SPEC nem SANKHYA_SPEC_ONLINE: a conferência com a documentação não rodou'

async function readSpec(): Promise<Spec | null> {
  // biome-ignore lint/style/noProcessEnv: a switch of this one check, not the app's configuration
  const given = process.env.SANKHYA_SPEC
  if (given) {
    const text = /^https?:\/\//.test(given)
      ? await (await globalThis.fetch(given)).text()
      : readFileSync(given, 'utf8')
    return Spec.parse(JSON.parse(text))
  }
  // biome-ignore lint/style/noProcessEnv: a switch of this one check, not the app's configuration
  return process.env.SANKHYA_SPEC_ONLINE === '1' ? downloadSpec() : null
}

/** Read once for the whole file: the online source takes a minute. */
let loaded: Promise<Spec | null> | undefined
function loadSpec(): Promise<Spec | null> {
  loaded ??= readSpec()
  return loaded
}

type Sample = { id: OperationId; request: ProviderRequest; body: unknown }

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

/** What the documentation says is wrong with one request and the answer the fake gave it. */
function problemsOf(spec: Spec, sample: Sample): string[] {
  const found = routeOf(spec, sample.request)
  if (!found)
    return [
      `${sample.id}: ${sample.request.method} ${sample.request.path} is not a documented route`,
    ]
  const [key, route] = found
  const problems = Object.keys(sample.request.query)
    .filter((name) => !route.query.includes(name))
    .map((name) => `${sample.id}: ${key} declares no query parameter ${name}`)
  const answer = z.fromJSONSchema(route.answer)
  if (!answer.safeParse(sample.body).success)
    problems.push(`${sample.id}: the fake's answer is not the 200 of ${key}`)
  return problems
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
    const request = requestOf(operation, input)
    const response = await fake.handle(toRequest(sankhya, request, token.accessToken))
    const body = z.unknown().parse(await response.json())
    const answered = operation.answer({ status: response.status, body })
    if (answered.kind === 'OK') earlier.set(operation.id, answered.value)
    out.push({ id: operation.id, request, body })
  }
  return out
}

describe('a documentação do Sankhya', () => {
  it('baixou', async (t) => {
    const spec = await loadSpec().catch((error: unknown) => {
      assert.fail(`a documentação do Sankhya não baixou (${SITE}): ${String(error)}`)
    })
    if (!spec) return t.skip(SKIP)
    assert.ok(Object.keys(spec.routes).length > 0, `a documentação do Sankhya não baixou (${SITE})`)
  })

  it('cada leitura confere com a documentação do Sankhya', async (t) => {
    const spec = await loadSpec().catch(() => null)
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

  it('recusa o dublê dos clientes sem o endereço e o filtro que a rota não declara', async (t) => {
    const spec = await loadSpec().catch(() => null)
    if (!spec) return t.skip(SKIP)
    const all = await samples()
    const clientes = all.find((sample) => sample.id === 'clientes')
    assert.ok(clientes)
    const bare = JSON.parse(JSON.stringify(clientes.body))
    bare.clientes[0].endereco = { cidade: 'Cidade Um', uf: 'SP' }
    assert.equal(problemsOf(spec, { ...clientes, body: bare }).length, 1)
    const extra = { ...clientes.request, query: { ...clientes.request.query, bogus: '1' } }
    assert.equal(problemsOf(spec, { ...clientes, request: extra }).length, 1)
  })
})
