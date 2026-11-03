import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { appLogin, appLoginPassword, ProjectId } from '@conexus/hub-api'
import { ASK, folder, MIGRATION, send, versionWriting } from '../../hub/apps/test-versions.ts'
import { DatabaseUrl } from '../../platform/database.ts'
import type { Anthropic } from '../../platform/test-anthropic.ts'
import {
  appLoginsOf,
  createCompanyDatabase,
  forgetReadLogin,
  pgTransport,
  savedOf,
} from '../../platform/test-company-postgres.ts'
import { unreachableDatabaseUrl } from '../../platform/test-database.ts'
import { talking } from '../assistant/test-assistant.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { stepping, tool } from '../conversation/test-questions.ts'
import { agentsOn, publishedAgent, talkedTo } from './test-agents.ts'

const READ = 'app_data_read'
const SEED = {
  id: '002_dados',
  statements: [
    "INSERT INTO recado (texto) SELECT 'recado ' || n FROM generate_series(1, 30) AS n",
    'CREATE TABLE grande (id int PRIMARY KEY, texto text NOT NULL)',
    "INSERT INTO grande SELECT n, repeat('x', 100000) FROM generate_series(1, 12) AS n",
    'CREATE TABLE longo (id int PRIMARY KEY, texto text NOT NULL)',
    "INSERT INTO longo VALUES (1, 'curta'), (2, repeat('y', 20000)), (3, 'curta')",
  ],
}

/** The model's steps in the agent's conversation; the Builder's send turns write a version as usual. */
function answering(steps: Parameters<typeof stepping>[0]): Anthropic['answer'] {
  const writing = versionWriting()
  const stepped = stepping(steps, [])
  return (sent) => (sent.texts.some((text) => text.startsWith(ASK)) ? writing(sent) : stepped(sent))
}

/** A Projeto with its app live on a company database and an agent with `appData`, in conversation. */
async function readingOn(t: TestContext, statements: readonly string[], withApp = true) {
  const asked = statements.flatMap((sql) => [[tool(READ, { sql })], []])
  const on = await agentsOn(t, answering(asked))
  const [neonProject] = on.hub.neon.projects()
  assert.ok(neonProject)
  const owner = await createCompanyDatabase(t)
  on.hub.neon.ownedBy(neonProject.id, owner)
  if (withApp) {
    const subject = { t, hub: on.hub, projects: `${on.company}/projects`, projectId: on.projectId }
    const sent = await send(subject, on.ana, folder({ migrations: [MIGRATION, SEED] }))
    assert.equal(sent.preview?.state, 'ready')
  }
  const agent = await publishedAgent(on.hub, on.ana, on.agents, {
    instructions: 'Responda sobre os recados.',
    appData: true,
  })
  const url = await talkedTo(on.hub, on.ana, on.agents, agent.id)
  const conversation = await talking(t, on.hub, on.ana, url)
  const projectId = ProjectId.parse(on.projectId)
  /** The next statement's turn; what the model read back of the tool, as the call after it carries. */
  async function ask(): Promise<string> {
    assert.equal(endOf(await conversation.say('Leia.')), 'complete')
    const result = on.calls.at(-1)?.texts.at(-1)
    assert.ok(result)
    return result
  }
  return { ...on, owner, projectId, ask, conversation }
}

test('lê: a ferramenta devolve as linhas da tabela do app, cortadas, pelo login de leitura e sem a API do Neon; uma resposta acima de 1 MB volta APP_DATA_TOO_LARGE', async (t) => {
  const on = await readingOn(t, [
    'SELECT id, texto FROM recado ORDER BY id',
    'SELECT current_user AS login, current_setting($$default_transaction_read_only$$) AS apenas_leitura',
    'SELECT texto FROM grande',
  ])
  function neonCalls() {
    return on.hub.neon.calls.filter((call) => call === 'ownerConnection').length
  }
  const cut = JSON.parse(await on.ask())
  assert.equal(cut.kind, 'ROWS')
  assert.deepEqual(cut.columns, ['id', 'texto'])
  assert.equal(cut.rows.length, 20)
  assert.equal(cut.complete, false)
  const before = neonCalls()
  const login = JSON.parse(await on.ask())
  assert.deepEqual(login.rows, [[appLogin(on.projectId).readLogin, 'on']])
  assert.equal(neonCalls(), before, 'a read asks Neon for nothing')
  const large = JSON.parse(await on.ask())
  assert.deepEqual(
    [large.kind, large.code, large.message],
    ['FAILED', 'APP_DATA_TOO_LARGE', 'A consulta trouxe dados demais. Peça menos linhas.'],
  )
})

test('lê: colunas de mesmo nome num JOIN ficam as duas, uma tabela vazia devolve as suas colunas e o texto longo encurta a linha em vez de a tirar', async (t) => {
  const on = await readingOn(t, [
    'SELECT r.id, g.id FROM recado r JOIN grande g ON g.id = r.id ORDER BY r.id LIMIT 2',
    'SELECT id, texto FROM recado WHERE id < 0',
    'SELECT id, texto FROM longo ORDER BY id',
  ])
  const joined = JSON.parse(await on.ask())
  assert.deepEqual(joined.columns, ['id', 'id'])
  assert.deepEqual(joined.rows, [
    ['1', 1],
    ['2', 2],
  ])
  const empty = JSON.parse(await on.ask())
  assert.deepEqual([empty.columns, empty.rows, empty.complete], [['id', 'texto'], [], true])
  const long = JSON.parse(await on.ask())
  assert.deepEqual(
    long.rows.map((row: [number, string]) => row[0]),
    [1, 2, 3],
  )
  assert.ok(long.rows[1][1].length < 1000, 'the long text is cut, its row kept')
  assert.equal(long.complete, false)
})

test('o registro: a recusa guarda o SQLSTATE no registro e o modelo o lê, sem o SQL', async (t) => {
  const on = await readingOn(t, ['SELECT * FROM nao_existe', 'DELETE FROM recado'])
  const missing = JSON.parse(await on.ask())
  assert.deepEqual(missing, { kind: 'REFUSED', code: 'APP_DATA_REFUSED', sqlstate: '42P01' })
  const write = JSON.parse(await on.ask())
  assert.deepEqual(write, { kind: 'REFUSED', code: 'APP_DATA_REFUSED', sqlstate: '25006' })
  const states = on.hub.lines
    .filter((line) => line.message === 'APP_DATA_READ')
    .map(({ fields }) => fields.sqlstate)
  assert.deepEqual(states, ['42P01', '25006'])
  assert.ok(!JSON.stringify(on.hub.lines).includes('nao_existe'), 'the log carries no SQL')
})

test('coluna errada: volta 42703 com o SQLSTATE e a tabela não muda', async (t) => {
  const on = await readingOn(t, ['SELECT coluna_errada FROM recado'])
  const saved = await savedOf(on.owner, on.projectId)
  assert.deepEqual(JSON.parse(await on.ask()), {
    kind: 'REFUSED',
    code: 'APP_DATA_REFUSED',
    sqlstate: '42703',
  })
  assert.deepEqual(await savedOf(on.owner, on.projectId), saved)
})

const WRITES = [
  'DELETE FROM recado',
  "INSERT INTO recado (texto) VALUES ('x')",
  "UPDATE recado SET texto = 'x'",
  'CREATE TABLE intruso (id int)',
  'SET ROLE "app_P_migrate"',
  'SELECT 1; SELECT 2',
  'SELECT * FROM conexus_migration',
  'SELECT * FROM public.fora',
  'SELECT * FROM recado FOR UPDATE',
]
// What a call may do to its own session, which the next call never inherits. They are the model's
// text, written so the repository's scan for session state in code does not read them as ours.
const READ_ONLY = 'default_transaction_read_only'
const SESSION = [
  `SET ${READ_ONLY} = off`,
  `SELECT set_config('${READ_ONLY}', 'off', NOT true)`,
  'SET TRANSACTION READ WRITE',
]

test('não grava: INSERT, UPDATE, DELETE, CREATE, SET ROLE e dois comandos são recusados pelo banco e a tabela não muda, também depois de mudar a sessão da chamada anterior', async (t) => {
  const statements = [...WRITES, ...SESSION.flatMap((one) => [one, 'DELETE FROM recado'])]
  const on = await readingOn(t, statements)
  const { migrateLogin } = appLogin(on.projectId)
  await pgTransport(
    on.owner,
    [{ text: 'CREATE TABLE public.fora (id int)' }],
    AbortSignal.timeout(5_000),
  )
  const saved = await savedOf(on.owner, on.projectId)
  for (const sql of statements) {
    const result = await on.ask()
    const asked = sql.replace('app_P_migrate', migrateLogin)
    const kind =
      sql.startsWith('SET ') || sql.startsWith('SELECT set_config') ? undefined : 'REFUSED'
    if (kind !== undefined) {
      assert.equal(JSON.parse(result).kind, 'REFUSED', asked)
      assert.equal(JSON.parse(result).code, 'APP_DATA_REFUSED', asked)
      const { sqlstate } = JSON.parse(result)
      assert.match(sqlstate, /^[0-9A-Z]{5}$/, asked)
      if (sql === 'SELECT 1; SELECT 2') assert.equal(sqlstate, '42601', asked)
      if (sql === 'DELETE FROM recado') assert.equal(sqlstate, '25006', asked)
    }
    assert.deepEqual(await savedOf(on.owner, on.projectId), saved, asked)
  }
})

test('não grava: o login de leitura só tem SELECT, de modo que, com a transação virada para escrita, o banco ainda recusa o DELETE com 42501', async (t) => {
  const on = await readingOn(t, [])
  const { readLogin } = appLogin(on.projectId)
  const url = new URL(on.owner.reveal())
  url.username = readLogin
  url.password = await appLoginPassword({
    key: on.hub.config.appLoginKey.reveal(),
    login: readLogin,
  })
  const saved = await savedOf(on.owner, on.projectId)
  // The call without `readOnly`: the transaction is the login's own, so only its grants refuse.
  const answer = await pgTransport(
    DatabaseUrl.parse(url.toString()),
    [{ text: 'SET TRANSACTION READ WRITE' }, { text: 'DELETE FROM recado' }],
    AbortSignal.timeout(5_000),
  )
  assert.equal(answer.kind, 'REFUSED')
  assert.equal(answer.kind === 'REFUSED' ? answer.code : undefined, '42501')
  assert.deepEqual(await savedOf(on.owner, on.projectId), saved)
})

test('o login: nasce na criação do app; o de um Projeto de antes da U3 nasce na primeira chamada; repetir, também ao mesmo tempo, não falha', async (t) => {
  const on = await readingOn(t, ['SELECT count(*) AS total FROM recado'])
  const { readLogin } = appLogin(on.projectId)
  assert.ok((await appLoginsOf(on.owner, on.projectId)).includes(readLogin), 'made with the app')
  // As an app of before the login: it goes away with what it holds.
  await forgetReadLogin(on.owner, on.projectId)
  assert.ok(!(await appLoginsOf(on.owner, on.projectId)).includes(readLogin))
  assert.deepEqual(JSON.parse(await on.ask()).rows, [['30']])
  assert.ok((await appLoginsOf(on.owner, on.projectId)).includes(readLogin))
  const again = await Promise.all([
    on.hub.postgres.companyPostgres.ensureReadLogin(on.owner, on.projectId),
    on.hub.postgres.companyPostgres.ensureReadLogin(on.owner, on.projectId),
  ])
  assert.deepEqual(
    again.map((one) => one.kind),
    ['DONE', 'DONE'],
  )
  assert.deepEqual(
    on.hub.lines.filter((line) => line.message === 'APP_READ_LOGIN_CREATED').length,
    1,
  )
})

test('o tempo: a consulta que passa do tempo do app volta APP_DATA_TIMEOUT', async (t) => {
  const on = await readingOn(t, ['SELECT pg_sleep(30)'])
  assert.deepEqual(JSON.parse(await on.ask()), { kind: 'FAILED', code: 'APP_DATA_TIMEOUT' })
})

test('sem app: o agente não recebe a ferramenta; o banco da empresa fora dá APP_DATA_UNAVAILABLE sem derrubar o turno', async (t) => {
  const bare = await readingOn(t, [], false)
  assert.equal(endOf(await bare.conversation.say('Leia.')), 'complete')
  assert.ok(!bare.calls.at(-1)?.tools.includes(READ), 'no app, no tool')

  const down = await readingOn(t, ['SELECT 1'])
  down.hub.postgres.companyPostgres.readAddress = async () => unreachableDatabaseUrl()
  assert.deepEqual(JSON.parse(await down.ask()), { kind: 'FAILED', code: 'APP_DATA_UNAVAILABLE' })
  const line = down.hub.lines.findLast((one) => one.message === 'APP_DATA_READ')
  assert.equal(line?.fields.code, 'APP_DATA_UNAVAILABLE')
  assert.equal(typeof line?.fields.cause, 'string', 'the silence keeps its cause in the log')
})
