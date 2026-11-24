import assert from 'node:assert/strict'
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CHECK_LIMITS } from '@conexus/app/check'
import { ENCOMENDAS_DEFEITO } from '@conexus/app/check/test-app'
import { CompanyId, ProjectId } from '@conexus/hub-api'
import type { MastraDBMessage } from '@mastra/core/agent'
import { checks } from '@mastra/evals/checks'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { post } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { REAL_MODEL } from '../assistant/test-real-model.ts'
import { APP_FOLDER } from '../machine/public.ts'
import { moveMain } from '../machine/test-machine.ts'
import { cloudHub, cloudSwitches } from './test-cloud-hub.ts'
import { asked, conversing, endOf, title } from './test-conversation.ts'
import { shownPartsOf, versionsOf } from './test-parts.ts'

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

const OPT_IN =
  "opt-in: the real-model case of the planted defect runs at the cloud checkpoint: set CONEXUS_EVAL_REAL_MODEL to the folder its report goes to, CONEXUS_EVAL_CLAUDE_CREDENTIAL to the test model account's kept Claude login (or sign in through the folder) and CONEXUS_EVAL_CLOUD_ENV to the installation's env file, all outside the repository (see cloudHub)"

type CloudHub = Awaited<ReturnType<typeof cloudHub>>

const REQUEST = 'Confira e entregue o app'

/** The Projeto's `main` holds the app with the planted defect, as a version that came before this conversation. */
async function seeded(hub: Hub, companyId: string, projectId: string): Promise<void> {
  const ids = { companyId: CompanyId.parse(companyId), projectId: ProjectId.parse(projectId) }
  await hub.builder.repository(ids).ensure()
  const gitDir = join(hub.config.gitRoot, companyId, `${projectId}.git`)
  for (const [path, text] of Object.entries(ENCOMENDAS_DEFEITO)) moveMain(gitDir, path, text)
}

/** One run of the real Builder on a fresh Projeto with the planted app: what each check said, how it ended and in how many rounds. */
async function defective(t: TestContext, cloud: CloudHub, name: string) {
  const { hub, ana, companyId } = cloud
  const made = await post(hub, ana, `/api/companies/${companyId}/projects`, { name })
  assert.equal(made.statusCode, 201, made.body)
  const projectId = String(Object(made.json()).project.id)
  await seeded(hub, companyId, projectId)
  const conversations = `/api/companies/${companyId}/projects/${projectId}/conversations`
  const { events } = await asked(t, { hub, person: ana, conversations }, REQUEST)
  const [ended] = hub.lines.filter((line) => line.message === 'CONVERSATION_TURN_ENDED').slice(-1)
  const rounds = Number(ended?.fields.rounds)
  const versions = versionsOf(shownPartsOf(events))
  const said = events.flatMap((event) =>
    event.type === 'task_complete_evaluation' ? [event.payload] : [],
  )
  const [saved] = versions.slice(-1)
  const ok = saved?.check === undefined ? false : Object(saved.check).state === 'passed'
  return { ok: ok && rounds <= CHECK_LIMITS.checks, rounds, versions, said, end: endOf(events) }
}

test('o defeito plantado: o Builder de verdade, com o pedido "Confira e entregue o app", termina com a conferência passed em até as voltas do limite, com a versão salva (18)', {
  timeout: 7_200_000,
}, async (t) => {
  const switches = cloudSwitches()
  if (REAL_MODEL === undefined || switches === undefined) {
    t.skip(OPT_IN)
    return
  }
  const cloud = await cloudHub(t, switches, REAL_MODEL)
  const runs: Awaited<ReturnType<typeof defective>>[] = []
  for (let attempt = 1; attempt <= 2 && !runs.some((run) => run.ok); attempt += 1) {
    runs.push(await defective(t, cloud, `Encomendas ${attempt}`))
  }
  writeFileSync(join(REAL_MODEL, 'defeito-plantado.json'), JSON.stringify({ runs }, null, 2))
  assert.ok(
    runs.some((run) => run.ok),
    `no run ended passed within ${CHECK_LIMITS.checks} rounds: ${JSON.stringify(runs)}`,
  )
})
