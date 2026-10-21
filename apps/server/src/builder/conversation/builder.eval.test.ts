import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { MastraDBMessage } from '@mastra/core/agent'
import { checks } from '@mastra/evals/checks'
import type { Hub } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { asked, conversing, title } from './test-conversation.ts'

const WRITE = 'mastra_workspace_write_file'
const PAGE = { path: 'index.html', content: '<h1>Padaria</h1>\n' }
const SKILL_TOOLS = ['skill', 'skill_read', 'skill_search']
/** What the instructions must tell a model to write: where the app is, and the skill to read first. */
const TELLS_TO_WRITE = [/read, write and edit files/, /\/home\/user\/app/, /skill conexus-app/]

/**
 * A model that does what the Builder's setup asks of it, and nothing else: it writes the page only
 * when the call it is given carries the server's instructions, the skill's tools and the write
 * tool. Break any of them and it answers in words, as a model with nothing to write with would.
 */
function obedient() {
  let wrote = false
  return (call: Sent): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    const equipped =
      TELLS_TO_WRITE.every((rule) => rule.test(call.system)) &&
      call.tools.includes(WRITE) &&
      SKILL_TOOLS.every((name) => call.tools.includes(name))
    if (!equipped || wrote) return { kind: 'text', text: 'Pronto.' }
    wrote = true
    return { kind: 'blocks', blocks: [{ type: 'tool_use', name: WRITE, input: PAGE }] }
  }
}

/** What Mastra saved of the turn, as the scorers read it: the thread's messages in order. */
async function savedMessages(pool: Hub['test']['mastraPool']) {
  const { rows } = await pool.query(
    'select id, role, content, "createdAt" from mastra.mastra_messages order by "createdAt"',
  )
  return rows.map(
    (row: { id: string; role: string; content: unknown; createdAt: Date }): MastraDBMessage => ({
      id: row.id,
      role: row.role === 'user' ? 'user' : 'assistant',
      createdAt: row.createdAt,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content,
    }),
  )
}

async function gate(t: TestContext) {
  const { hub, ana, conversations } = await conversing(t, obedient())
  const { events } = await asked(
    t,
    { hub, person: ana, conversations },
    'Faça uma página para a padaria',
  )
  const output = await savedMessages(hub.test.mastraPool)
  const scores = []
  for (const scorer of [checks.calledTool(WRITE), checks.noToolErrors()]) {
    scores.push(
      (
        await scorer.run({
          input: {
            inputMessages: [],
            rememberedMessages: [],
            systemMessages: [],
            taggedSystemMessages: {},
          },
          output,
        })
      ).score,
    )
  }
  return { events, scores, folder: join(hub.builder.folder, 'app') }
}

test('o portão do Builder: o Builder de verdade escreveu os arquivos e nenhuma ferramenta deu erro', async (t) => {
  const { events, scores, folder } = await gate(t)
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(readFileSync(join(folder, PAGE.path), 'utf8'), PAGE.content)
  assert.deepEqual(scores, [1, 1])
})
