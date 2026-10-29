import assert from 'node:assert/strict'
import { test } from 'node:test'
import { WRITE_HEADERS } from '../../platform/test-database.ts'
import { ANA_OWNER, hubWithMail, INVITEE, personOn, plantCompany, post } from './test-hub.ts'

test('invitation mail renders the generated module at send time with escaped HTML, plain text, button, fallback and expiry', async (t) => {
  const hub = await hubWithMail(t)
  const name = 'Ana <img src=x onerror=alert(1)> & Lima'
  const companyName = '<script>alert(2)</script> & Empresa'
  const ana = await personOn(hub, { ...ANA_OWNER, name })
  const companyId = await plantCompany(hub.test, ana.id, companyName)
  const created = await post(hub, ana, `/api/companies/${companyId}/invitations`, {
    email: INVITEE,
    role: 'member',
  })
  assert.equal(created.statusCode, 201)
  const { invitation } = Object(created.json())
  assert.equal(hub.mail.sent.length, 1)
  const sent = hub.mail.sent[0]
  assert.ok(sent !== undefined)
  assert.deepEqual(sent.from, { address: 'convites@hub.example.test', name: 'Conexus' })
  assert.equal(sent.to, INVITEE)
  assert.equal(sent.subject, `Convite para ${companyName}`)
  const link = `https://hub.example.test/invitations/${invitation.id}`
  assert.ok(sent.html.includes(`href="${link}"`))
  assert.ok(sent.html.includes('Ver convite'))
  assert.ok(sent.html.includes('Se o botão não abrir'))
  assert.ok(sent.html.includes('&lt;script&gt;'))
  assert.ok(sent.html.includes('&lt;img'))
  assert.ok(!sent.html.includes('<script>'))
  assert.ok(!sent.html.includes('<img src=x'))
  assert.ok(sent.text.includes(companyName))
  assert.ok(sent.text.includes(name))
  assert.ok(sent.text.includes(link))
  assert.ok(sent.text.includes('Ver convite'))
  assert.ok(sent.text.includes('ninguém entra na empresa sem a sua resposta'))
  const expiry = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(new Date(invitation.expiresAt))
  assert.ok(sent.html.includes(`${expiry} UTC`))
  assert.ok(sent.text.includes(`${expiry} UTC`))
  const password = await hub.app.inject({
    method: 'PUT',
    url: `/api/invitations/${invitation.id}/password`,
    headers: WRITE_HEADERS,
    payload: { name: 'Davi Costa', password: 'senha-nova-1', revision: 0 },
  })
  assert.equal(password.statusCode, 204)
  assert.equal(hub.mail.sent.length, 1)
})
