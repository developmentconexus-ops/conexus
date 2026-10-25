import assert from 'node:assert/strict'
import { test } from 'node:test'
import { conversing, endOf, sent, started, streamOf, title } from './test-conversation.ts'

const LIST = 'mastra_workspace_list_files'

test('o modelo que sempre pede ferramenta: no passo 100 vai sem ferramenta (toolChoice none, que o provedor manda como pedido sem ferramentas) e responde em texto, sem abort; "continue" dá mais 100', async (t) => {
  const steps: { toolless: boolean; system: string }[] = []
  const { hub, ana, conversations } = await conversing(t, (call) => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    // The memory's observer calls the model with no tools too; only the Builder's steps count.
    if (!call.system.includes('You are the Conexus Builder'))
      return { kind: 'text', text: 'Observação' }
    steps.push({ toolless: call.tools.length === 0, system: call.system })
    if (call.tools.length === 0) return { kind: 'text', text: 'Fiz as listagens; falta o resto.' }
    return { kind: 'blocks', blocks: [{ type: 'tool_use', name: LIST, input: { path: '.' } }] }
  })
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Liste sempre')).statusCode, 200)
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.equal(steps.length, 100)
  assert.deepEqual(steps.filter((step) => step.toolless).length, 1)
  assert.equal(steps.at(-1)?.toolless, true)
  assert.match(steps.at(-1)?.system ?? '', /last step of this turn/)
  assert.doesNotMatch(steps[98]?.system ?? '', /last step of this turn/)
  assert.equal((await sent(hub, ana, url, 'continue')).statusCode, 200)
  assert.equal(endOf(await stream.turn()), 'complete')
  assert.equal(steps.length, 200)
})
