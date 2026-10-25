import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import type { StreamEvent } from './test-conversation.ts'
import { asked, messagesOf, sent, started, streamOf } from './test-conversation.ts'
import { previewing, previewsIn } from './test-preview.ts'

// The end of the turn tells its version at once, then whether it reached the app, and keeps both
// in one message (step 14.1, U1).

/** What each of our parts in a message started says: its type, and the machine's phase. */
function oursIn(events: StreamEvent[]): string[] {
  return events.flatMap((event) => {
    if (event.type === 'agent_end') return ['agent_end']
    if (event.type !== 'message_start') return []
    return event.message.content.parts.flatMap((part: MastraMessagePart) => {
      if (part.type === 'data-conexus-machine') return [`machine:${Object(part.data).phase}`]
      return part.type.startsWith('data-conexus-') ? [part.type] : []
    })
  })
}

test('ordem das partes: a versão, a fase sending, a Prévia pronta, e só então o agent_end (2)', async (t) => {
  const { hub, ana, conversations } = await previewing(t)
  const { events } = await asked(t, { hub, person: ana, conversations })
  const said = oursIn(events)
  const version = said.indexOf('data-conexus-version')
  const sending = said.indexOf('machine:sending')
  const preview = said.lastIndexOf('data-conexus-preview')
  assert.ok(version >= 0 && version < sending && sending < preview, said.join(' '))
  assert.equal(said.at(-1), 'agent_end')
  const [ready] = previewsIn(
    events.flatMap((event) => (event.type === 'message_start' ? event.message.content.parts : [])),
  )
  assert.deepEqual(ready, { state: 'ready', number: 1 })
})

test('a versão não espera o envio: com o envio parado, o fluxo já tem a versão e não o agent_end (3)', async (t) => {
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
  assert.ok(!oursIn(before).includes('agent_end'))
  assert.ok(!oursIn(before).includes('data-conexus-preview'))
  held.release()
  const rest = await stream.turn()
  assert.deepEqual(oursIn(rest).slice(-2), ['data-conexus-preview', 'agent_end'])
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
