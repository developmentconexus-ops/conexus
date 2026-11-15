import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { endOf } from '../conversation/test-conversation.ts'
import { assisting, created, talking } from './test-assistant.ts'

const fixed = readFileSync(new URL('./prompt/assistant.md', import.meta.url), 'utf8')
const section = fixed.slice(
  fixed.indexOf('# Tools'),
  fixed.indexOf('\n# ', fixed.indexOf('# Tools') + 1),
)
const named = [...section.matchAll(/\*\*([a-z_]+)\*\*/g)].map((each) => each[1] ?? '')

test('cada ferramenta que a seção Tools nomeia é uma que o Assistente oferece, no Início ou num Projeto', async (t) => {
  const on = await assisting(t)
  const home = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  const inProject = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz],
  })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, home)).say('Oi')), 'complete')
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, inProject)).say('Oi')), 'complete')

  const offered = new Set(on.calls.flatMap((asked) => asked.tools))
  assert.ok(named.length > 20, named.join(', '))
  assert.deepEqual(
    named.filter((name) => !offered.has(name)),
    [],
    [...offered].join(', '),
  )
})
