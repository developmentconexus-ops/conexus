import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assisting, created, said, talking } from '../assistant/test-assistant.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'

const COMMAND = 'mastra_workspace_execute_command'
const HOLD_MS = 400

function stamped(description: string) {
  return tool(COMMAND, { description, command: `sleep 0.4; node -p "Date.now()"` })
}

test('as ferramentas de um passo rodam juntas', async (t) => {
  const on = await assisting(t, [[stamped('Primeira'), stamped('Segunda')], [said('Pronto.')]])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Rode as duas')), 'complete')
  const ended = (on.calls.at(1)?.toolResults ?? []).map((each) =>
    Number(JSON.parse(each.text).output ?? each.text.match(/\d{13}/)?.[0]),
  )
  assert.equal(ended.length, 2, 'both commands answered in the same step')
  const [first = 0, second = 0] = ended
  assert.ok(
    Math.abs(second - first) < HOLD_MS,
    `the second ended ${Math.abs(second - first)} ms after the first: they ran one after the other`,
  )
})
