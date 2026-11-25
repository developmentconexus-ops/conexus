import assert from 'node:assert/strict'
import { test } from 'node:test'
import { asked, conversing, title } from '../../harness/routes/test-conversation.ts'
import { shownPartsOf, versionsOf } from '../../harness/routes/test-parts.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'

const WRITE = {
  type: 'tool_use',
  name: 'mastra_workspace_write_file',
  input: { path: 'a.ts', content: 'x\n' },
} as const

test('o juiz do fim do turno que lança: o turno termina sem conferência e o log traz a causa', async (t) => {
  let steps = 0
  let armed = false
  function answer(call: Sent): Reply {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    steps += 1
    armed ||= steps === 2
    return steps === 1 ? { kind: 'blocks', blocks: [WRITE] } : { kind: 'text', text: 'Pronto.' }
  }
  const { hub, ana, conversations } = await conversing(t, answer)
  const { control } = hub.builder
  control.afterCommand = () => {
    if (!armed) return
    control.afterCommand = () => undefined
    throw Object.assign(new Error('SECRET-PLANTED-TEXT'), { code: 'ECONNRESET' })
  }
  const { events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app')
  assert.deepEqual(versionsOf(shownPartsOf(events)), [
    { number: 1, changedFiles: 1, check: { state: 'unchecked', code: 'CHECK_PLATFORM_FAILED' } },
  ])
  const logged = hub.lines.filter((line) => line.message === 'CHECK_JUDGE_FAILED')
  assert.equal(logged.length, 1)
  const [line] = logged
  assert.equal(line?.fields.code, 'ECONNRESET')
  assert.match(String(line?.fields.conversationId), /^[0-9a-f-]{36}$/)
  assert.equal(typeof line?.fields.runId, 'string', 'the log names the run of the scorer')
  assert.ok(!JSON.stringify(hub.lines).includes('SECRET-PLANTED-TEXT'))
})
