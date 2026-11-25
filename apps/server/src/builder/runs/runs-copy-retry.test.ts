import assert from 'node:assert/strict'
import { rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { mock, test } from 'node:test'
import { asked, conversing, title } from '../../harness/routes/test-conversation.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'

const WRITE = {
  type: 'tool_use',
  name: 'mastra_workspace_write_file',
  input: { path: 'a.ts', content: 'x\n' },
} as const

test('a repetição das cópias que falha inteira: cada volta registra a falha com o código e o relógio segue', async (t) => {
  let steps = 0
  function answer(call: Sent): Reply {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    steps += 1
    return steps === 1 ? { kind: 'blocks', blocks: [WRITE] } : { kind: 'text', text: 'Pronto.' }
  }
  const { hub, ana, conversations, companyId } = await conversing(t, answer)
  hub.builder.bucket.refuse.puts = 2
  await asked(t, { hub, person: ana, conversations })
  // The retry the failed copy armed with the real clock ends here; the clock below is the test's.
  hub.runs.stop()
  mock.timers.enable({ apis: ['setTimeout'] })
  t.after(() => mock.timers.reset())
  await hub.runs.resumeCopies()
  const companyFolder = join(hub.config.gitRoot, companyId)
  rmSync(companyFolder, { recursive: true })
  writeFileSync(companyFolder, '')
  function failed() {
    return hub.lines.filter((line) => line.message === 'GIT_COPY_RETRY_FAILED')
  }
  async function lapsed(count: number) {
    for (let waited = 0; failed().length < count && waited < 1000; waited += 1) {
      await new Promise((done) => setImmediate(done))
    }
  }
  mock.timers.tick(30_000)
  await lapsed(1)
  assert.equal(failed().length, 1)
  mock.timers.tick(60_000)
  await lapsed(2)
  assert.equal(failed().length, 2, 'the clock went on after the failure')
  assert.equal(failed()[0]?.fields.code, 'ENOTDIR')
})
