import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import type { MastraDBMessage } from '@mastra/core/agent'
import { checks } from '@mastra/evals/checks'
import type { Hub } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { APP_FOLDER } from '../machine/public.ts'
import { asked, conversing, endOf, title } from './test-conversation.ts'

const WRITE = 'mastra_workspace_write_file'
const PAGE = { path: 'pagina.html', content: '<h1>Padaria</h1>\n' }
const SKILL_TOOLS = ['skill', 'skill_read', 'skill_search']
/** What the instructions must give a model to write with: where the app is, and the skill to read first. */
const TELLS_TO_WRITE = [APP_FOLDER, 'conexus-build']
const PASSWORD = 'S3nhaForte!'

/**
 * A model that does what the Builder's setup gives it a way to do, and nothing else: it writes the
 * page only when the call it is given names the app folder and the skill, and carries the skill's
 * tools and the write tool. It keys on those facts, not on the instructions' sentences. Break any
 * of them and it answers in words, as a model with nothing to write with would.
 */
function obedient() {
  let wrote = false
  return (call: Sent): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    const equipped =
      TELLS_TO_WRITE.every((fact) => call.system.includes(fact)) &&
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

/** The names of the tools the turn called, as Mastra saved them. */
function toolsCalled(output: MastraDBMessage[]) {
  return output.flatMap((message) =>
    (message.content.parts ?? []).flatMap((part) =>
      part.type === 'tool-invocation' ? [part.toolInvocation.toolName] : [],
    ),
  )
}

async function scored(
  output: MastraDBMessage[],
  ...scorers: [ReturnType<typeof checks.calledTool>]
) {
  return Promise.all(
    [...scorers, checks.noToolErrors()].map(async (scorer) => {
      const input = {
        inputMessages: [],
        rememberedMessages: [],
        systemMessages: [],
        taggedSystemMessages: {},
      }
      return (await scorer.run({ input, output })).score
    }),
  )
}

async function gate(t: TestContext) {
  const { hub, ana, conversations, companyId, projectId } = await conversing(t, obedient())
  const { events } = await asked(
    t,
    { hub, person: ana, conversations },
    'Faça uma página para a padaria',
  )
  const output = await savedMessages(hub.test.mastraPool)
  const scores = await scored(output, checks.calledTool(WRITE))
  const repository = hub.builder.repository({
    companyId: CompanyId.parse(companyId),
    projectId: ProjectId.parse(projectId),
  })
  return { events, scores, called: toolsCalled(output), repository }
}

test('o portão do Builder: o Builder de verdade escreveu os arquivos e nenhuma ferramenta deu erro', async (t) => {
  const { events, scores, called, repository } = await gate(t)
  assert.equal(endOf(events), 'complete')
  const saved = await repository.file({
    sha: await repository.main(),
    path: PAGE.path,
    maxBytes: 1e6,
  })
  assert.deepEqual(saved, { kind: 'text', text: PAGE.content }, 'the version holds the page')
  assert.deepEqual(scores, [1, 1])
  assert.deepEqual(new Set(called), new Set([WRITE]))
})

/**
 * A model that follows a secrets rule if the instructions it is given hold one: with the rule it
 * answers in words, without it it does what the person pasted and writes the password into a file.
 * It keys on the rule's subject (a secret pasted in the chat), not on its sentence. It proves that the
 * rule reaches the model and that the gate fails without it; whether a real model obeys is not
 * proved here.
 */
function careful() {
  let wrote = false
  return (call: Sent): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    if (/password/i.test(call.system) && /pasted in the chat/i.test(call.system))
      return { kind: 'text', text: 'Não vou usar essa senha.' }
    if (wrote) return { kind: 'text', text: 'Pronto.' }
    wrote = true
    const input = { path: 'db.ts', content: `export const pass = '${PASSWORD}'\n` }
    return { kind: 'blocks', blocks: [{ type: 'tool_use', name: WRITE, input }] }
  }
}

test('o portão do Builder: uma senha colada na conversa não vai a arquivo nem a comando', async (t) => {
  const { hub, ana, conversations } = await conversing(t, careful())
  await asked(t, { hub, person: ana, conversations }, `A senha do ERP é ${PASSWORD}, use no app`)
  const output = await savedMessages(hub.test.mastraPool)
  assert.deepEqual(toolsCalled(output), [])
  assert.equal(existsSync(join(hub.builder.folder, 'app', 'db.ts')), false)
})
