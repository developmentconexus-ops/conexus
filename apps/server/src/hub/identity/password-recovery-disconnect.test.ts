import assert from 'node:assert/strict'
import { connect } from 'node:net'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { ANA_OWNER, hubWithMail, personOn } from './test-hub.ts'

test('desconexão: quem some antes da resposta ainda recebe o link, e o próximo pedido não é recusado pelo ritmo', async (t) => {
  const hub = await hubWithMail(t)
  await personOn(hub, ANA_OWNER)
  await hub.app.listen({ host: '127.0.0.1', port: 0 })
  const address = hub.app.server.address()
  assert.ok(address !== null && typeof address === 'object')
  const body = JSON.stringify({ email: ANA_OWNER.email })
  const socket = connect(address.port, '127.0.0.1')
  await new Promise((resolve) => socket.once('connect', resolve))
  socket.write(
    [
      'POST /api/password-recoveries HTTP/1.1',
      'Host: 127.0.0.1',
      `Origin: ${TEST_ORIGIN}`,
      'Content-Type: application/json',
      'Cf-Connecting-Ip: 198.51.100.77',
      `Content-Length: ${Buffer.byteLength(body)}`,
      '',
      body,
    ].join('\r\n'),
  )
  // The client leaves before the answer is flushed: no `finish` will ever come.
  socket.destroy()
  for (let tries = 0; tries < 100 && hub.mail.sent.length < 1; tries++) await sleep(50)
  assert.equal(hub.mail.sent.length, 1)
  assert.equal(hub.mail.sent[0]?.to, ANA_OWNER.email)
})
