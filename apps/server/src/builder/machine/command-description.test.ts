import assert from 'node:assert/strict'
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { STEP_NAMES } from '@conexus/app/check'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { assisting, created, said, talking } from '../assistant/test-assistant.ts'
import { asked, conversing, endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'

const COMMAND = 'mastra_workspace_execute_command'

/** The JSON schema of the command tool as a call carried it to the model. */
function commandSchema(call: Sent | undefined) {
  const schema = Object(call?.schemas[COMMAND])
  return {
    properties: Object(schema.properties),
    required: Array.isArray(schema.required) ? schema.required : [],
  }
}

function listedFirst(properties: object) {
  return Object.keys(properties)
}

test('a frase vem antes do comando, nas duas máquinas', async (t) => {
  const assistant = await assisting(t, [
    [{ type: 'tool_use', name: COMMAND, input: { command: 'ls' } }],
    [tool(COMMAND, { description: 'Listando os arquivos', command: 'ls' })],
    [said('Pronto.')],
  ])
  const url = await created(assistant.hub, assistant.ana, assistant.assistant, { connections: [] })
  const { say } = await talking(t, assistant.hub, assistant.ana, url)
  assert.equal(endOf(await say('Liste')), 'complete')
  const first = commandSchema(assistant.calls[0])
  assert.deepEqual(listedFirst(first.properties).slice(0, 2), ['description', 'command'])
  assert.ok(first.required.includes('description'), 'the phrase is required')
  const refused = assistant.calls[1]?.toolResults.at(-1)
  assert.equal(refused?.error, true, 'a call without the phrase is a validation error')
  const ran = assistant.calls[2]?.toolResults.at(-1)
  assert.notEqual(ran?.error, true, `with the phrase the command runs: ${ran?.text}`)

  const calls: Sent[] = []
  function answer(call: Sent): Reply {
    if (!call.system.includes('You are the Conexus Builder')) return { kind: 'text', text: 'x' }
    calls.push(call)
    return { kind: 'text', text: 'Pronto.' }
  }
  const { hub, ana, conversations } = await conversing(t, answer)
  mkdirSync(hub.builder.folder, { recursive: true })
  const report = join(hub.builder.folder, 'check-passed')
  writeFileSync(
    report,
    JSON.stringify({
      ok: true,
      steps: STEP_NAMES.map((name) => ({ name, state: 'passed', problems: [] })),
    }),
  )
  writeFileSync(join(hub.builder.folder, 'check'), `#!/bin/sh\ncat '${report}'\n`)
  chmodSync(join(hub.builder.folder, 'check'), 0o755)
  await asked(t, { hub, person: ana, conversations }, 'Crie o app de encomendas')
  const built = commandSchema(calls[0])
  assert.deepEqual(listedFirst(built.properties).slice(0, 2), ['description', 'command'])
  assert.ok(built.required.includes('description'))
})
