import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import {
  ANA_OWNER,
  BRUNO,
  call,
  codeOf,
  memberOn,
  personOn,
  plantCompany,
  post,
  problem,
  refusal,
} from '../../hub/identity/test-hub.ts'
import { ATENDENTE } from '../../hub/identity/test-roles.ts'
import { EDU, networkCompany } from './test-network.ts'

const API = { domain: 'api.exemplo.com', reason: 'Ler o catálogo de preços' }
const NOT_IN_ROLE = {
  ...refusal(
    'NOT_IN_ROLE',
    409,
    'Seu papel não pode usar a ferramenta a lista de internet da empresa.',
  ),
  operation: 'a lista de internet da empresa',
}

test('todo membro lê a lista; fora da empresa, 404', async (t) => {
  const { hub, ana, bruno, carla, davi, path } = await networkCompany(t)
  const star = { domain: '*.zeta.com.br', reason: 'Imagens do site' }
  const added = await post(hub, ana, path, star)
  assert.equal(added.statusCode, 200, added.body)
  assert.equal((await post(hub, bruno, path, API)).statusCode, 200)

  for (const person of [ana, bruno, carla, davi]) {
    const read = await call(hub, person, 'GET', path)
    assert.equal(read.statusCode, 200, read.body)
    const listed = Object(read.json()).domains.map(
      ({ id, grantedAt, ...rest }: Record<string, unknown>) => {
        assert.match(String(id), /^[0-9a-f-]{36}$/)
        assert.ok(Math.abs(Date.now() - Date.parse(String(grantedAt))) < 60_000, String(grantedAt))
        return rest
      },
    )
    assert.deepEqual(listed, [
      { ...API, grantedBy: BRUNO.name },
      { ...star, grantedBy: ANA_OWNER.name },
    ])
  }

  const outsider = await personOn(hub, EDU)
  await plantCompany(hub.test, outsider.id, 'Outra Empresa')
  const id = Object(added.json()).id
  for (const refused of [
    await call(hub, outsider, 'GET', path),
    await post(hub, outsider, path, API),
    await call(hub, outsider, 'DELETE', `${path}/${id}`),
  ]) {
    assert.equal(refused.statusCode, 404, refused.body)
    assert.equal(codeOf(refused), 'NOT_FOUND')
  }
})

test('só dono e administrador adicionam', async (t) => {
  const { hub, ana, bruno, carla, davi, companyId, path, rows } = await networkCompany(t)
  const made = await post(hub, ana, `/api/companies/${companyId}/roles`, ATENDENTE)
  assert.equal(made.statusCode, 201, made.body)
  const edu = await memberOn(hub, companyId, EDU, 'atendente')

  for (const person of [carla, davi, edu]) {
    const refused = await post(hub, person, path, API)
    assert.equal(refused.statusCode, 409, refused.body)
    assert.deepEqual(problem(refused), NOT_IN_ROLE)
  }
  assert.deepEqual(await rows(), [])

  for (const [person, domain, stored] of [
    [ana, 'Exemplo.COM', 'exemplo.com'],
    [bruno, 'münchen.de', 'xn--mnchen-3ya.de'],
  ] as const) {
    const added = await post(hub, person, path, { domain, reason: '  Ler o catálogo  ' })
    assert.equal(added.statusCode, 200, added.body)
    assert.equal(Object(added.json()).domain, stored)
    assert.equal(Object(added.json()).reason, 'Ler o catálogo')
  }
  assert.deepEqual(await rows(), [
    { domain: 'exemplo.com', reason: 'Ler o catálogo', granted_by: ana.id },
    { domain: 'xn--mnchen-3ya.de', reason: 'Ler o catálogo', granted_by: bruno.id },
  ])

  const invalid = await post(hub, ana, path, { ...API, domain: '*.com.br' })
  assert.equal(invalid.statusCode, 400, invalid.body)
  assert.deepEqual(
    problem(invalid),
    refusal('NETWORK_DOMAIN_INVALID', 400, 'Este domínio não pode ser liberado.'),
  )
  for (const reason of ['   ', 'a'.repeat(201)]) {
    const refused = await post(hub, ana, path, { ...API, reason })
    assert.equal(codeOf(refused), 'REQUEST_MALFORMED', refused.body)
  }
  assert.equal((await post(hub, ana, path, { ...API, reason: 'a'.repeat(200) })).statusCode, 200)
  assert.equal((await rows()).length, 3)

  const granted = hub.lines.filter(({ message }) => message === 'NETWORK_DOMAIN_GRANTED')
  assert.deepEqual(
    granted.map(({ fields }) => fields),
    Array.from({ length: 3 }, () => ({ companyId, scope: 'COMPANY', domains: 1 })),
  )
  assert.doesNotMatch(JSON.stringify(hub.lines), /exemplo\.com|mnchen/i)
})

test('o mesmo domínio duas vezes é uma linha', async (t) => {
  const { hub, ana, bruno, path, rows } = await networkCompany(t)
  const together = await Promise.all(
    [ana, bruno, ana, bruno, ana, bruno].map((person) => post(hub, person, path, API)),
  )
  for (const each of together) assert.equal(each.statusCode, 200, each.body)
  const [first] = together.map((each) => each.json())
  assert.deepEqual(
    together.map((each) => each.json()),
    together.map(() => first),
  )
  const again = await post(hub, bruno, path, { domain: 'API.Exemplo.com', reason: 'Outro motivo' })
  assert.equal(again.statusCode, 200, again.body)
  assert.deepEqual(again.json(), first)
  assert.equal((await rows()).length, 1)
})

test('o domínio removido entre o insert e a leitura é gravado de novo', async (t) => {
  const { hub, ana, path, rows } = await networkCompany(t)
  const first = Object((await post(hub, ana, path, API)).json())
  await hub.test.asOwner(
    `create function builder.remove_between() returns trigger language plpgsql as
      $$ begin delete from builder.company_network_domain where id = '${first.id}'; return null; end $$`,
  )
  await hub.test.asOwner(
    `create trigger remove_between after insert on builder.company_network_domain
      for each statement execute function builder.remove_between()`,
  )
  const again = await post(hub, ana, path, API)
  assert.equal(again.statusCode, 200, again.body)
  assert.notEqual(Object(again.json()).id, first.id)
  assert.equal((await rows()).length, 1)
})

test('só dono e administrador removem', async (t) => {
  const { hub, ana, bruno, carla, davi, companyId, path, rows } = await networkCompany(t)
  const one = Object((await post(hub, ana, path, API)).json()).id
  const two = Object((await post(hub, ana, path, { ...API, domain: 'outro.com' })).json()).id

  for (const person of [carla, davi]) {
    const refused = await call(hub, person, 'DELETE', `${path}/${one}`)
    assert.equal(refused.statusCode, 409, refused.body)
    assert.deepEqual(problem(refused), NOT_IN_ROLE)
  }
  const edu = await personOn(hub, EDU)
  const elsewhere = await plantCompany(hub.test, edu.id, 'Outra Empresa')
  const crossed = await call(
    hub,
    edu,
    'DELETE',
    `/api/companies/${elsewhere}/network/domains/${one}`,
  )
  assert.equal(crossed.statusCode, 404, crossed.body)
  assert.equal((await rows()).length, 2)

  for (const [person, domainId] of [
    [ana, one],
    [bruno, two],
  ] as const) {
    const removed = await call(hub, person, 'DELETE', `${path}/${domainId}`)
    assert.equal(removed.statusCode, 204, removed.body)
  }
  assert.deepEqual(await rows(), [])
  for (const missing of [one, randomUUID(), 'nao-e-um-id']) {
    const refused = await call(hub, ana, 'DELETE', `${path}/${missing}`)
    assert.equal(refused.statusCode, 404, refused.body)
    assert.equal(codeOf(refused), 'NOT_FOUND')
  }
  const removals = hub.lines.filter(({ message }) => message === 'NETWORK_DOMAIN_REMOVED')
  assert.deepEqual(
    removals.map(({ fields }) => fields),
    [{ companyId }, { companyId }],
  )
})
