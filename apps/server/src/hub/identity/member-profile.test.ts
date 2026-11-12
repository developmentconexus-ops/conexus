import assert from 'node:assert/strict'
import { test } from 'node:test'
import { listMembers, MEMBER_PROFILE_MAX, setMemberProfile } from '@conexus/hub-api'
import { queued, TEST_ORIGIN, withOwnerLock } from '../../platform/test-database.ts'
import { call, codeOf, personOn, plantCompany } from './test-hub.ts'
import type { World } from './test-roles.ts'
import { promoteThroughPlugin, world } from './test-roles.ts'

const OUTSIDER = { name: 'Eva Neves', email: 'eva@example.test' }
const ANA = { jobTitle: 'Diretora comercial', department: 'Vendas' }
const BLANK = { jobTitle: null, department: null }

function profileUrl(w: World, personId: string) {
  return `${w.base}/members/${personId}/profile`
}

function stored(w: World, personId: string) {
  return w.hub.test.asOwner(
    `select job_title as "jobTitle", department from auth.member where user_id = $1`,
    [personId],
  )
}

test('cargo e área: a pessoa grava os seus, de novo é o mesmo, e esvazia', async (t) => {
  const w = await world(t)
  const url = profileUrl(w, w.bruno.id)
  const first = await call(w.hub, w.bruno, 'PUT', url, {
    jobTitle: '  Analista de compras ',
    department: 'Compras',
  })
  assert.equal(first.statusCode, 200)
  const { member } = setMemberProfile.success.body.parse(first.json())
  assert.deepEqual(
    { ...member, personId: undefined },
    {
      ...{ personId: undefined, name: 'Bruno Reis', email: 'bruno@example.test', role: 'member' },
      ...{ mayRemove: true, mayChangeTo: [], mayEditProfile: true, invitationsSent: 0 },
      ...{ jobTitle: 'Analista de compras', department: 'Compras' },
    },
  )
  assert.deepEqual(await stored(w, w.bruno.id), [
    { jobTitle: 'Analista de compras', department: 'Compras' },
  ])

  const again = await call(w.hub, w.bruno, 'PUT', url, {
    jobTitle: 'Analista de compras',
    department: 'Compras',
  })
  assert.equal(again.statusCode, 200)
  assert.deepEqual(again.json(), first.json())

  const listed = await call(w.hub, w.bruno, 'GET', `${w.base}/members`)
  const mine = listMembers.success.body
    .parse(listed.json())
    .members.find((one) => one.personId === w.bruno.id)
  assert.deepEqual([mine?.jobTitle, mine?.department], ['Analista de compras', 'Compras'])
  const others = listMembers.success.body
    .parse(listed.json())
    .members.filter((one) => one.personId !== w.bruno.id)
  assert.ok(others.length >= 3)
  for (const one of others) {
    assert.deepEqual([one.jobTitle, one.department, one.mayEditProfile], [null, null, false])
  }

  const cleared = await call(w.hub, w.bruno, 'PUT', url, BLANK)
  assert.equal(cleared.statusCode, 200)
  assert.deepEqual(await stored(w, w.bruno.id), [BLANK])
  assert.equal(setMemberProfile.success.body.parse(cleared.json()).member.jobTitle, null)
})

test('cargo e área: o dono e o administrador gravam os de outro membro, e cada um vê o que pode', async (t) => {
  const w = await world(t)
  const byAdmin = await call(w.hub, w.admin, 'PUT', profileUrl(w, w.bruno.id), ANA)
  assert.equal(byAdmin.statusCode, 200)
  assert.deepEqual(setMemberProfile.success.body.parse(byAdmin.json()).member, {
    ...{ personId: w.bruno.id, name: 'Bruno Reis', email: 'bruno@example.test' },
    ...{ role: 'member', mayRemove: true, mayChangeTo: ['admin', 'developer'] },
    ...{ ...ANA, mayEditProfile: true, invitationsSent: 0 },
  })
  assert.deepEqual(await stored(w, w.bruno.id), [ANA])

  const byOwner = await call(w.hub, w.ana, 'PUT', profileUrl(w, w.developer.id), {
    jobTitle: 'Desenvolvedora',
    department: null,
  })
  assert.equal(byOwner.statusCode, 200)
  assert.deepEqual(await stored(w, w.developer.id), [
    { jobTitle: 'Desenvolvedora', department: null },
  ])

  const seenByMember = await call(w.hub, w.bruno, 'GET', `${w.base}/members`)
  const seen = listMembers.success.body.parse(seenByMember.json()).members
  assert.deepEqual(seen.map((one) => [one.personId === w.bruno.id, one.mayEditProfile]).sort(), [
    [false, false],
    [false, false],
    [false, false],
    [true, true],
  ])
  assert.equal(
    listMembers.success.body
      .parse((await call(w.hub, w.admin, 'GET', `${w.base}/members`)).json())
      .members.every((one) => one.mayEditProfile),
    true,
  )
})

test('cargo e área: quem não pode mudar papel recebe NOT_IN_ROLE ao gravar os de outro, e nada muda', async (t) => {
  const w = await world(t)
  for (const writer of [w.bruno, w.developer]) {
    const refused = await call(w.hub, writer, 'PUT', profileUrl(w, w.admin.id), ANA)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'NOT_IN_ROLE'])
    const body = Object(refused.json())
    assert.equal(body.operation, 'o cargo e a área de outra pessoa')
  }
  assert.deepEqual(await stored(w, w.admin.id), [BLANK])
  const own = await call(w.hub, w.developer, 'PUT', profileUrl(w, w.developer.id), ANA)
  assert.equal(own.statusCode, 200)
})

test('cargo e área: acima de 80 caracteres e fora da forma, REQUEST_MALFORMED, e nada muda', async (t) => {
  const w = await world(t)
  const url = profileUrl(w, w.bruno.id)
  const limit = 'a'.repeat(MEMBER_PROFILE_MAX)
  const bodies = [
    { jobTitle: `${limit}b`, department: null },
    { jobTitle: null, department: `${limit}b` },
    { jobTitle: '', department: null },
    { jobTitle: '   ', department: null },
    { jobTitle: 7, department: null },
    { jobTitle: null },
  ]
  for (const body of bodies) {
    const answer = await call(w.hub, w.bruno, 'PUT', url, body)
    assert.deepEqual(
      [answer.statusCode, codeOf(answer)],
      [400, 'REQUEST_MALFORMED'],
      JSON.stringify(body),
    )
  }
  assert.deepEqual(await stored(w, w.bruno.id), [BLANK])
  const edge = await call(w.hub, w.bruno, 'PUT', url, { jobTitle: limit, department: limit })
  assert.equal(edge.statusCode, 200)
  assert.deepEqual(await stored(w, w.bruno.id), [{ jobTitle: limit, department: limit }])
  const more = await call(w.hub, w.bruno, 'PUT', url, { ...BLANK, role: 'owner' })
  assert.equal(more.statusCode, 200)
  assert.equal(
    await w.hub.test
      .asOwner(`select role from auth.member where user_id = $1`, [w.bruno.id])
      .then((rows) => Object(rows[0]).role),
    'member',
  )
})

test('cargo e área: quem é de outra empresa, quem não é membro e quem não entrou recebem a recusa da tabela', async (t) => {
  const w = await world(t)
  const outsider = await personOn(w.hub, OUTSIDER)
  await plantCompany(w.hub.test, outsider.id, 'Empresa Outra')
  const stranger = await call(w.hub, outsider, 'PUT', profileUrl(w, w.bruno.id), ANA)
  assert.deepEqual([stranger.statusCode, codeOf(stranger)], [404, 'NOT_FOUND'])
  const own = await call(w.hub, outsider, 'PUT', profileUrl(w, outsider.id), ANA)
  assert.deepEqual([own.statusCode, codeOf(own)], [404, 'NOT_FOUND'])

  const gone = await call(w.hub, w.ana, 'PUT', profileUrl(w, outsider.id), ANA)
  assert.deepEqual([gone.statusCode, codeOf(gone)], [404, 'NOT_FOUND'])

  const anonymous = await w.hub.app.inject({
    method: 'PUT',
    url: profileUrl(w, w.bruno.id),
    headers: { origin: TEST_ORIGIN, 'content-type': 'application/json' },
    payload: JSON.stringify(ANA),
  })
  assert.deepEqual([anonymous.statusCode, codeOf(anonymous)], [401, 'SESSION_REQUIRED'])
  assert.deepEqual(await stored(w, w.bruno.id), [BLANK])
})

// The company is held, so the two writes queue on its lock in the order they are sent, and the race
// runs the same way every time: the last to run is the one that stays.
test('cargo e área: duas gravações juntas, a segunda a rodar vence e o membro fica inteiro', async (t) => {
  const w = await world(t)
  const lockCompany = 'select id from auth.company where id = $1 for update'
  const answers = await withOwnerLock(w.hub.test, lockCompany, [w.companyId], async (release) => {
    const url = profileUrl(w, w.bruno.id)
    const first = call(w.hub, w.admin, 'PUT', url, ANA)
    await queued(w.hub.test, 1, first)
    const second = call(w.hub, w.bruno, 'PUT', url, { jobTitle: 'Comprador', department: null })
    await queued(w.hub.test, 2, second)
    await release()
    return Promise.all([first, second])
  })
  assert.deepEqual(
    answers.map((response) => response.statusCode),
    [200, 200],
  )
  assert.deepEqual(await stored(w, w.bruno.id), [{ jobTitle: 'Comprador', department: null }])
})

test('cargo e área: o plugin do Better Auth lê os campos extras do membro e os guarda ao mudar o papel', async (t) => {
  const w = await world(t)
  assert.equal((await call(w.hub, w.bruno, 'PUT', profileUrl(w, w.bruno.id), ANA)).statusCode, 200)
  const member = await promoteThroughPlugin(w, w.bruno.id)
  assert.deepEqual(
    [member?.role, member?.jobTitle, member?.department],
    ['admin', ANA.jobTitle, ANA.department],
  )
  assert.deepEqual(await stored(w, w.bruno.id), [ANA])
})
