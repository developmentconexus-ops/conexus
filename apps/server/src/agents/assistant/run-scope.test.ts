import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { endOf, sessionUrl } from '../../harness/routes/test-conversation.ts'
import { RUN_MARKS } from '../../harness/spec/public.ts'
import { plantMark } from '../../harness/spec/test-run.ts'
import { codeOf, post } from '../../hub/identity/test-hub.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

test('marca de outra empresa: a thread do Assistente marcada com outra empresa dá CONVERSATION_NOT_FOUND, sem chamada ao modelo', async (t) => {
  const on = await assisting(t, [[said('Oi.')]])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const elsewhere = randomUUID().replaceAll('-', '')
  await plantMark(on.hub, String(url.split('/').at(-1)), {
    [RUN_MARKS.assistant.company]: elsewhere,
  })
  const sent = await post(on.hub, on.ana, `${sessionUrl(url)}/messages`, { message: 'Oi' })
  assert.deepEqual([sent.statusCode, codeOf(sent)], [404, 'CONVERSATION_NOT_FOUND'])
  assert.equal(on.calls.length, 0, 'the model is never called')
})

test('o lugar vem da linha: a marca de Projeto trocada não leva ao Projeto a conversa do Início', async (t) => {
  const on = await assisting(t, [[said('Oi.')]])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  await plantMark(on.hub, String(url.split('/').at(-1)), {
    [RUN_MARKS.assistant.project]: on.projectId,
  })
  const events = await (await talking(t, on.hub, on.ana, url)).say('Quanto vendemos?')
  assert.equal(endOf(events), 'complete')
  const system = JSON.stringify(on.calls.at(0)?.systems)
  assert.match(system, /Place: Início/)
  assert.doesNotMatch(system, /Encomendas/)
})
