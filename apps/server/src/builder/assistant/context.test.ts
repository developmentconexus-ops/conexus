import assert from 'node:assert/strict'
import { test } from 'node:test'
import { endOf, messagesOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { assisting, created, said, talking } from './test-assistant.ts'
import { conversation, LONG } from './test-files.ts'

const LIST = '<current-task-list'
const NOTE = tool('task_write', {
  tasks: [{ content: 'Somar os pedidos', status: 'pending', activeForm: 'Somando os pedidos' }],
})

/** The conversation's messages, not the fixed text that names the block. */
function carries(call: { texts: string[] } | undefined) {
  return call?.texts.some((text) => text.includes(LIST)) === true
}

test('a lista de tarefas como estado', async (t) => {
  const on = await assisting(t, [[NOTE], [said('Pronto.')]])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(
    endOf(await (await talking(t, on.hub, on.ana, url)).say('Some os pedidos')),
    'complete',
  )
  const stored = JSON.stringify(await messagesOf(on.hub, on.ana, url))
  assert.equal(stored.includes(LIST), false, 'the state signal is not a message of the person')
  assert.equal(carries(on.calls[0]), false, 'before the first note there is no list')
  assert.equal(carries(on.calls.at(-1)), true, 'after task_write the request carries the list')

  const long = await conversation(t, (_, index) => {
    if (index === 0) return { kind: 'blocks', blocks: [NOTE] }
    return { kind: 'text', text: index < 3 ? LONG : 'Li.' }
  })
  for (const question of ['Some os pedidos', 'E os prazos?', 'E as multas?', 'E o resto?'])
    assert.equal(endOf(await long.say(question)), 'complete')
  assert.ok(long.observers.length > 0, 'the conversation was observed')
  assert.equal(
    carries(long.calls.at(-1)),
    true,
    'after an observation the list stays in the request',
  )
})
