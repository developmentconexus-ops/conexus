import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import type { StreamEvent } from './test-conversation.ts'
import { asked, messagesOf, sent, started, streamOf } from './test-conversation.ts'
import { previewing, previewsIn } from './test-preview.ts'

// The end of the turn keeps and tells its version at once, the Prévia `sending`, then the same
// message with whether it reached the app (step 14.1, U1, and the step review's call 1).

/** What our parts in each message started say: their type, a machine's phase, a Prévia's state. */
function oursIn(events: StreamEvent[]): string[] {
  return events.flatMap((event) => {
    if (event.type === 'agent_end') return ['agent_end']
    if (event.type !== 'message_start') return []
    return event.message.content.parts.flatMap((part: MastraMessagePart) => {
      if (part.type === 'data-conexus-machine') return [`machine:${Object(part.data).phase}`]
      if (part.type === 'data-conexus-preview') return [`preview:${Object(part.data).state}`]
      return part.type.startsWith('data-conexus-') ? [part.type] : []
    })
  })
}

/** Our messages told on the stream, by id, in order. */
function toldIn(events: StreamEvent[]): { id: string; parts: string[] }[] {
  return events.flatMap((event) =>
    event.type === 'message_start' && !event.message.id.endsWith(':machine')
      ? [{ id: event.message.id, parts: oursIn([event]) }]
      : [],
  )
}

test('ordem das partes: a versão com a Prévia sending, a mesma mensagem pronta, e só então o agent_end (2)', async (t) => {
  const { hub, ana, conversations } = await previewing(t)
  const { events } = await asked(t, { hub, person: ana, conversations })
  const said = oursIn(events).filter((one) => !one.startsWith('machine:'))
  assert.deepEqual(said, [
    ...['data-conexus-version', 'preview:sending'],
    ...['data-conexus-version', 'preview:ready', 'agent_end'],
  ])
  const told = toldIn(events).filter((message) => message.parts.length > 0)
  assert.equal(new Set(told.map((message) => message.id)).size, 1, 'one message, told twice')
  const parts = events.flatMap((event) =>
    event.type === 'message_start' ? event.message.content.parts : [],
  )
  assert.deepEqual(previewsIn(parts), [
    { state: 'sending', number: 1 },
    { state: 'ready', number: 1 },
  ])
})

test('a versão não espera o envio: com o envio parado, o fluxo já tem a versão sending e não o agent_end (3)', async (t) => {
  const { hub, ana, conversations } = await previewing(t)
  const held = hub.cloudflare.holdUpload()
  t.after(() => held.release())
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Crie o app')).statusCode, 200)
  const before: StreamEvent[] = []
  const reading = (async () => {
    while (!oursIn(before).includes('data-conexus-version')) before.push(await stream.next())
  })()
  await held.arrived
  await Promise.race([reading, setTimeout(5_000)])
  assert.ok(oursIn(before).includes('data-conexus-version'), 'told while the send is held')
  assert.ok(oursIn(before).includes('preview:sending'))
  assert.ok(!oursIn(before).includes('agent_end'))
  assert.ok(!oursIn(before).includes('preview:ready'))
  held.release()
  const rest = await stream.turn()
  assert.deepEqual(oursIn(rest).slice(-2), ['preview:ready', 'agent_end'])
})

test('recarregar no meio do envio: a mensagem guardada já tem a versão e a Prévia sending, e no fim a pronta (31)', async (t) => {
  const { hub, ana, conversations } = await previewing(t)
  const held = hub.cloudflare.holdUpload()
  t.after(() => held.release())
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Crie o app')).statusCode, 200)
  await held.arrived
  async function oursKept() {
    return (await messagesOf(hub, ana, url)).filter((message) =>
      message.parts.some((part) => part.type.startsWith('data-conexus-')),
    )
  }
  const during = await oursKept()
  assert.equal(during.length, 1)
  assert.deepEqual(
    during[0]?.parts.map((part) => part.type),
    ['data-conexus-version', 'data-conexus-preview'],
  )
  assert.deepEqual(previewsIn(during[0]?.parts ?? []), [{ state: 'sending', number: 1 }])
  held.release()
  await stream.turn()
  const after = await oursKept()
  assert.deepEqual(
    after.map((message) => message.id),
    during.map((message) => message.id),
  )
  assert.deepEqual(previewsIn(after[0]?.parts ?? []), [{ state: 'ready', number: 1 }])
})

test('a mensagem guardada: recarregar traz uma mensagem só com a versão e a Prévia (4)', async (t) => {
  const { hub, ana, conversations } = await previewing(t)
  const { url } = await asked(t, { hub, person: ana, conversations })
  const ours = (await messagesOf(hub, ana, url)).filter((message) =>
    message.parts.some((part) => part.type.startsWith('data-conexus-')),
  )
  assert.equal(ours.length, 1)
  assert.deepEqual(
    ours[0]?.parts.map((part) => part.type),
    ['data-conexus-version', 'data-conexus-preview'],
  )
  assert.deepEqual(previewsIn(ours[0]?.parts ?? []), [{ state: 'ready', number: 1 }])
})

test('o desligamento espera o envio: o Hub fechando no meio do envio só fecha com a versão no ar (13)', async (t) => {
  const { hub, ana, conversations } = await previewing(t)
  const held = hub.cloudflare.holdUpload()
  t.after(() => held.release())
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Crie o app')).statusCode, 200)
  await held.arrived
  let closed = false
  const closing = hub.close().then(() => {
    closed = true
  })
  await setTimeout(500)
  assert.equal(closed, false, 'the shutdown waits for the send')
  held.release()
  await closing
  const [app] = await hub.test.asOwner(
    'select v.number, v.state from apps.app a join apps.app_version v on v.id = a.live_version_id',
  )
  assert.deepEqual(app, { number: 1, state: 'ready' })
})
