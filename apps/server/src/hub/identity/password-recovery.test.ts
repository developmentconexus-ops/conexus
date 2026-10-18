import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { serveEnvironment, WRITE_HEADERS } from '../../platform/test-database.ts'
import { spawnHub } from '../../platform/test-hub-process.ts'
import type { MailHub } from './test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  codeOf,
  hubWithMail,
  id,
  PASSWORD,
  personOn,
  problem,
  read,
  refusal,
  signIn,
} from './test-hub.ts'

const RECOVERIES = '/api/password-recoveries'
const LINK = /https:\/\/hub\.example\.test\/set-password#token=([^&\s]+)&kind=recovery/

function ask(
  hub: MailHub,
  email: string,
  address = `198.51.100.${Math.ceil(Math.random() * 250)}`,
) {
  return hub.app.inject({
    method: 'POST',
    url: RECOVERIES,
    headers: { ...WRITE_HEADERS, 'cf-connecting-ip': address },
    payload: JSON.stringify({ email }),
  })
}

function choose(hub: MailHub, token: string, password: string) {
  return hub.app.inject({
    method: 'PUT',
    url: '/api/passwords',
    headers: WRITE_HEADERS,
    payload: JSON.stringify({ token, password }),
  })
}

/** The mail goes out after the answer, so a test waits for it where it lands. */
async function mailed(hub: MailHub, count: number): Promise<void> {
  for (let tries = 0; tries < 100 && hub.mail.sent.length < count; tries++) await sleep(50)
  assert.equal(hub.mail.sent.length, count)
}

function tokenIn(hub: MailHub, index: number): string {
  const found = LINK.exec(hub.mail.sent[index]?.text ?? '')
  assert.ok(found?.[1], 'the mail carries the recovery link')
  return found[1]
}

async function withoutPassword(hub: MailHub, who: { name: string; email: string }) {
  await hub.test.asOwner('insert into auth.user (id, name, email) values ($1, $2, $3)', [
    id(),
    who.name,
    who.email,
  ])
}

async function ageLinks(hub: MailHub): Promise<void> {
  await hub.test.asOwner(`update auth.verification set created_at = now() - interval '2 minutes'`)
}

test('pedido: 202 vazio com conta, sem conta e sem senha; só quem tem senha recebe, uma vez por minuto, e o link anterior para', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  await withoutPassword(hub, BRUNO)

  const unknown = await ask(hub, CARLA.email)
  const noPassword = await ask(hub, BRUNO.email)
  const known = await ask(hub, ANA_OWNER.email)
  for (const reply of [unknown, noPassword, known]) {
    assert.equal(reply.statusCode, 202)
    assert.equal(reply.body, '')
  }
  await mailed(hub, 1)
  assert.equal(hub.mail.sent[0]?.to, ANA_OWNER.email)
  assert.match(hub.mail.sent[0]?.text ?? '', /O link vale 1 hora/)

  const [first] = await hub.test.asOwner(
    'select identifier, extract(epoch from expires_at - created_at)::int as seconds from auth.verification where value = $1',
    [ana.id],
  )
  assert.equal(first?.seconds, 3600)

  const again = await ask(hub, ANA_OWNER.email)
  assert.equal(again.statusCode, 202)
  assert.deepEqual(
    await hub.test.asOwner('select identifier from auth.verification where value = $1', [ana.id]),
    [{ identifier: first?.identifier }],
  )
  assert.equal(hub.mail.sent.length, 1)

  await ageLinks(hub)
  assert.equal((await ask(hub, ANA_OWNER.email)).statusCode, 202)
  await mailed(hub, 2)
  const stale = await choose(hub, tokenIn(hub, 0), 'senha-nova-1')
  assert.deepEqual([stale.statusCode, codeOf(stale)], [422, 'PASSWORD_LINK_INVALID'])
  assert.equal((await choose(hub, tokenIn(hub, 1), 'senha-nova-1')).statusCode, 204)
})

test('pedido: dois ao mesmo tempo enviam um só e-mail', async (t) => {
  const hub = await hubWithMail(t)
  await personOn(hub, ANA_OWNER)
  const replies = await Promise.all([ask(hub, ANA_OWNER.email), ask(hub, ANA_OWNER.email)])
  assert.deepEqual(
    replies.map((reply) => reply.statusCode),
    [202, 202],
  )
  await mailed(hub, 1)
  await sleep(300)
  assert.equal(hub.mail.sent.length, 1)
})

test('limite: o quarto pedido da mesma rede em 60 s é 429, mesmo para e-mail sem conta; outra rede pede', async (t) => {
  const hub = await hubWithMail(t)
  const address = '198.51.100.250'
  for (let attempt = 1; attempt <= 3; attempt++) {
    assert.equal((await ask(hub, CARLA.email, address)).statusCode, 202, `pedido ${attempt}`)
  }
  const fourth = await ask(hub, CARLA.email, address)
  assert.equal(fourth.statusCode, 429)
  assert.deepEqual(
    problem(fourth),
    refusal('RECOVERY_ATTEMPTS_EXCEEDED', 429, 'Muitos pedidos deste computador ou rede.'),
  )
  assert.equal((await ask(hub, CARLA.email, '198.51.100.249')).statusCode, 202)
})

test('correio: o e-mail sai depois da resposta', async (t) => {
  const hub = await hubWithMail(t)
  await personOn(hub, ANA_OWNER)
  hub.mail.state.mode = 'HOLD'
  const reply = await ask(hub, ANA_OWNER.email)
  assert.equal(reply.statusCode, 202)
  assert.equal(hub.mail.sent.length, 0)
  await hub.mail.held
  hub.mail.releaseHeld()
  await mailed(hub, 1)
})

test('correio: fora do ar, o pedido é 202, o link fica e a falha é registrada pelo código', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const { port, lines, stop } = await spawnHub(t, serveEnvironment(t, hub.test.runtimeUrl))
  const reply = await fetch(`http://127.0.0.1:${port}${RECOVERIES}`, {
    method: 'POST',
    headers: WRITE_HEADERS,
    body: JSON.stringify({ email: ANA_OWNER.email }),
  })
  assert.equal(reply.status, 202)
  for (let tries = 0; tries < 100 && !lines.some((l) => l.msg === 'MAIL_UNAVAILABLE'); tries++)
    await sleep(50)
  await stop()
  assert.ok(lines.some((line) => line.msg === 'MAIL_UNAVAILABLE'))
  assert.deepEqual(
    await hub.test.asOwner(
      'select count(*)::int as links from auth.verification where value = $1',
      [ana.id],
    ),
    [{ links: 1 }],
  )
  const output = JSON.stringify(lines)
  assert.doesNotMatch(output, new RegExp(ANA_OWNER.email))
})

test('sessões: trocar a senha apaga as sessões da pessoa e só as dela; o mesmo link de novo é 422', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const bruno = await personOn(hub, BRUNO)
  const second = await signIn(hub, { email: ANA_OWNER.email, password: PASSWORD })
  assert.equal(second.statusCode, 200)
  assert.equal((await read(hub, ana.cookie)).json().state, 'SIGNED_IN')

  assert.equal((await ask(hub, ANA_OWNER.email)).statusCode, 202)
  await mailed(hub, 1)
  const token = tokenIn(hub, 0)
  const chosen = await choose(hub, token, 'senha-nova-1')
  assert.equal(chosen.statusCode, 204)

  assert.equal((await read(hub, ana.cookie)).json().state, 'SIGNED_OUT')
  assert.equal((await read(hub, bruno.cookie)).json().state, 'SIGNED_IN')
  assert.deepEqual(
    await hub.test.asOwner(
      'select count(*)::int as sessions from auth.session where user_id = $1',
      [ana.id],
    ),
    [{ sessions: 0 }],
  )
  const reused = await choose(hub, token, 'outra-senha-2')
  assert.deepEqual([reused.statusCode, codeOf(reused)], [422, 'PASSWORD_LINK_INVALID'])
  assert.equal(
    (await signIn(hub, { email: ANA_OWNER.email, password: 'senha-nova-1' })).statusCode,
    200,
  )
})
