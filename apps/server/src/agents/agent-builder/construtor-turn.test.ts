import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { endOf, streamOf } from '../../harness/routes/test-conversation.ts'
import { post } from '../../hub/identity/test-hub.ts'
import { alive, googleOnly, within } from '../assistant/test-google-assistant.ts'

test('o fim do turno do Construtor solta o processo do Google: a sessão devolve a vez no agent_end', async (t) => {
  const on = await googleOnly(t)
  const url = `/api/companies/${on.companyId}/projects/${on.projectId}/construtor/conversations`
  const made = await post(
    on.hub,
    on.ana,
    url,
    { model: 'google/gemini-3.5-flash-lite' },
    randomUUID(),
  )
  assert.equal(made.statusCode, 201, made.body)
  const conversation = `${url}/${String(Object(made.json()).conversation.id)}`
  const stream = await streamOf(on.hub, on.ana, conversation)
  t.after(() => stream.close())
  const pid = await on.asking(on.ana, conversation, 'google-thinking')
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.ok(await within(5_000, () => !alive(pid)), 'a turn that ended lets it go')
})
