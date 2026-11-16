import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { DATA_TOOL, DataResult } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import { asSync } from '../../hub/copies/test-copies.ts'
import { releasing } from '../../hub/copies/test-released.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import type { Block } from '../../platform/test-anthropic-stream.ts'
import { endOf, messagesOf, started, title } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { assisting, created, reading, said, searching, talking } from './test-assistant.ts'
import type { CopyQuestion } from './test-copy-questions.ts'
import { COPY_QUESTIONS, judgedCopy } from './test-copy-questions.ts'
import { EVAL_PROVIDER, REAL_MODEL, subscribed } from './test-real-model.ts'
import { scoreOf } from './test-scorecard.ts'

type Plan = (call: Sent) => Reply
/** Where a question is asked: the Hub and its owner, the Assistant's and the Builder's conversations, and the Sankhya connection. */
type Place = Pick<
  Awaited<ReturnType<typeof assisting>>,
  'hub' | 'ana' | 'assistant' | 'conversations' | 'companyId' | 'projectId'
> & { matriz: string }

const BRL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
function inOctober(column: string): string {
  return `${column} >= '2026-10-01' and ${column} < '2026-11-01'`
}
const SQL = {
  c1: `select sum("VLRNOTA") as total from sync.sankhya_vendas where ${inOctober('"DTNEG"')}`,
  c2: `select count(*) as n from sync.sankhya_clientes where "ATIVO" = 'S' and "CLIENTE" = 'S'`,
  c3: `select v."APELIDO" as nome, sum(c."VLRNOTA") as total from sync.sankhya_vendas c join sync.sankhya_vendedores v on v."CODVEND" = c."CODVEND" where ${inOctober('c."DTNEG"')} group by 1 order by 2 desc limit 1`,
  c6: `select table_name from information_schema.tables where table_schema = 'sync' and table_name like '%cliente%'`,
}
const LIVE_SQL =
  "SELECT ROUND(SUM(C.VLRNOTA), 2) AS TOTAL FROM TGFCAB C WHERE C.DTNEG BETWEEN '2026-10-01' AND '2026-10-31'"
const OTHER_TABLE = 'select count(*) as n from sync.sankhya_clientes'
const MISSING_TABLE = 'select count(*) as n from sync.sankhya_comissoes'

function questionOf(n: CopyQuestion['n']): CopyQuestion {
  const found = COPY_QUESTIONS.find((each) => each.n === n)
  assert.ok(found, n)
  return found
}

function money(value: number | string): string {
  return `R$ ${BRL.format(Number(value))}`
}

function resultsOf(call: Sent) {
  return call.toolResults.flatMap((each) => {
    const read = DataResult.safeParse(JSON.parse(each.text))
    return read.success ? [read.data] : []
  })
}

/** A model that lists the catalog, then runs `sql`, then says what the first row it was given holds. */
function querying(sql: string, say: (row: unknown[]) => string): Plan {
  return (call) => {
    const titled = title(call)
    if (titled !== undefined) return titled
    const rows = resultsOf(call).find((each) => each.kind === 'ROWS')
    if (rows !== undefined) return { kind: 'text', text: say(rows.rows[0] ?? []) }
    const first = call.toolResults.length === 0
    return {
      kind: 'blocks',
      blocks: [first ? tool(DATA_TOOL.describe, {}) : tool(DATA_TOOL.query, { sql })],
    }
  }
}

/** A model that lists the catalog, then says what the tables it was given are. */
function describing(say: (tables: string[]) => string): Plan {
  return (call) => {
    const titled = title(call)
    if (titled !== undefined) return titled
    const catalog = resultsOf(call).find((each) => each.kind === 'CATALOG')
    if (catalog === undefined) return { kind: 'blocks', blocks: [tool(DATA_TOOL.describe, {})] }
    return { kind: 'text', text: say(catalog.tables.map((each) => each.name)) }
  }
}

/** A model that does one list of blocks per step, whatever the tools answer. */
function scripted(steps: Block[][]): Plan {
  return (call) => title(call) ?? { kind: 'blocks', blocks: steps[call.toolResults.length] ?? [] }
}

async function partsOf(on: Place, url: string): Promise<MastraMessagePart[]> {
  const messages = await messagesOf(on.hub, on.ana, url)
  const asked = messages.findLastIndex((message) => message.role === 'person')
  return messages.slice(asked + 1).flatMap((message) => message.parts)
}

/** One question in a new conversation of whoever asks it: the parts of the answer and the events of its turn. */
async function turnOf(t: TestContext, on: Place, asked: CopyQuestion) {
  const url =
    asked.asks === 'OWNER'
      ? await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
      : `${on.conversations}/${await started(on.hub, on.ana, on.conversations)}`
  const events = await (await talking(t, on.hub, on.ana, url)).say(asked.text)
  assert.equal(endOf(events), 'complete')
  return { parts: await partsOf(on, url), events }
}

/** The sales copy's last run as it ended: the test writes the row the engine writes when the page cap stops a run, since the test Hub takes no `runPages`. */
function ending(on: Place, last: 'COMPLETE' | 'PARTIAL') {
  return on.hub.test.asOwner(
    `update copies.copy_run set outcome = $1, reason = $2 where copy_id = (select id from copies.copy where name = 'sankhya_vendas')`,
    [last, last === 'PARTIAL' ? 'CAP' : null],
  )
}

/** A hub whose model follows the plan the test sets, with the Sankhya copies of the company run once. */
async function copiedOn(t: TestContext, released: readonly string[] = []) {
  let plan: Plan = () => ({ kind: 'text', text: 'Pronto.' })
  const on = await assisting(t, (call) => plan(call))
  const copies = await releasing(
    t,
    on,
    { connectionId: on.matriz },
    ['vendas', 'vendedores', 'clientes'],
    released,
  )
  return {
    on,
    copies,
    follows(next: Plan) {
      plan = next
    },
  }
}

function same(truth: number | string | null, found: unknown): boolean {
  return typeof truth === 'number' ? Math.abs(truth - Number(found)) < 0.005 : truth === found
}

test('as perguntas do dado copiado: cada uma com tabela, número e origem esperados, calculados do dublê', async (t) => {
  assert.deepEqual(
    COPY_QUESTIONS.map((each) => each.n),
    ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
  )
  const { copies } = await copiedOn(t)
  function owned(sql: string) {
    return asSync(copies.owner, async (client) => (await client.query(sql)).rows)
  }
  const [sold] = await owned(SQL.c1)
  const [clients] = await owned(SQL.c2)
  const [seller] = await owned(SQL.c3)
  const found = {
    c1: sold?.total,
    c2: clients?.n,
    c3: seller?.nome,
    c4: null,
    c5: sold?.total,
    c6: (await owned(SQL.c6)).map((row) => row.table_name).join(),
  }
  for (const each of COPY_QUESTIONS) {
    assert.equal(each.tables.length === 0, each.n === 'c4', each.n)
    assert.ok(
      same(each.truth(), found[each.n]),
      `${each.n}: double ${String(each.truth())} vs copy ${String(found[each.n])}`,
    )
  }
})

test('o placar do dado copiado julga certo um turno que consulta e cita a origem, e errado um que lê o sistema ao vivo', async (t) => {
  const { on, follows } = await copiedOn(t)
  const c1 = questionOf('c1')
  const said1 = `Em outubro você vendeu ${money(Number(c1.truth()))}.`

  follows(querying(SQL.c1, (row) => `Em outubro você vendeu ${money(String(row[0]))}.`))
  const right = await turnOf(t, on, c1)
  assert.equal(judgedCopy(c1, right.parts), true)
  assert.equal(scoreOf({ question: 1, ...right, right: true }).errors, 0)
  assert.equal(scoreOf({ question: 1, ...right, right: true }).firstQueryFailed, false)

  follows(scripted([[searching()], [reading('Matriz', LIVE_SQL)], [said(said1)]]))
  assert.equal(judgedCopy(c1, (await turnOf(t, on, c1)).parts), false, 'a live read')

  follows(
    scripted([
      [tool(DATA_TOOL.describe, {})],
      [tool(DATA_TOOL.query, { sql: SQL.c1 })],
      [searching()],
      [reading('Matriz', LIVE_SQL)],
      [said(said1)],
    ]),
  )
  assert.equal(
    judgedCopy(c1, (await turnOf(t, on, c1)).parts),
    false,
    'the right query, then a live read',
  )

  follows(
    scripted([
      [tool(DATA_TOOL.describe, {})],
      [tool(DATA_TOOL.query, { sql: OTHER_TABLE })],
      [said(said1)],
    ]),
  )
  assert.equal(
    judgedCopy(c1, (await turnOf(t, on, c1)).parts),
    false,
    'another table in the origin',
  )
})

test('o placar do dado copiado julga a rodada parcial, o apelido do vendedor e a pergunta do Builder', async (t) => {
  const { on, follows } = await copiedOn(t, questionOf('c6').released)
  const [c3, c5, c6] = [questionOf('c3'), questionOf('c5'), questionOf('c6')]

  follows(querying(SQL.c3, (row) => `${String(row[0])} vendeu mais, ${money(String(row[1]))}.`))
  assert.equal(judgedCopy(c3, (await turnOf(t, on, c3)).parts), true)

  await ending(on, 'PARTIAL')
  function total(row: unknown[]) {
    return `Em outubro você vendeu ${money(String(row[0]))}`
  }
  follows(querying(SQL.c1, (row) => `${total(row)}, mas a cópia está incompleta.`))
  assert.equal(judgedCopy(c5, (await turnOf(t, on, c5)).parts), true)
  follows(querying(SQL.c1, (row) => `${total(row)}.`))
  assert.equal(judgedCopy(c5, (await turnOf(t, on, c5)).parts), false, 'no word of warning')

  follows(describing((tables) => `Você tem ${tables.join(', ')}.`))
  assert.equal(judgedCopy(c6, (await turnOf(t, on, c6)).parts), true)
  follows(describing((tables) => `Você tem ${tables.join(', ')} e sankhya_vendas.`))
  assert.equal(judgedCopy(c6, (await turnOf(t, on, c6)).parts), false, 'a table the Projeto lacks')
})

test('não achei é resposta: c4 é certa com prosa que nomeia uma tabela que existe e nenhuma chamada em erro', async (t) => {
  const { on, follows } = await copiedOn(t)
  const c4 = questionOf('c4')

  follows(describing((tables) => `Não achei comissão; tenho ${tables.join(', ')}.`))
  const right = await turnOf(t, on, c4)
  assert.equal(judgedCopy(c4, right.parts), true)
  assert.equal(scoreOf({ question: 4, ...right, right: true }).errors, 0)

  follows(describing((tables) => `Pagamos ${money(1234)} de comissão, em ${tables.join(', ')}.`))
  assert.equal(judgedCopy(c4, (await turnOf(t, on, c4)).parts), false, 'a number')

  follows(
    scripted([
      [tool(DATA_TOOL.describe, {})],
      [tool(DATA_TOOL.query, { sql: MISSING_TABLE })],
      [said('Não achei comissão; tenho sankhya_vendas.')],
    ]),
  )
  const refused = await turnOf(t, on, c4)
  assert.equal(judgedCopy(c4, refused.parts), false, 'a refusal')
  assert.equal(scoreOf({ question: 4, ...refused, right: false }).errors, 1)
  assert.equal(scoreOf({ question: 4, ...refused, right: false }).firstQueryFailed, true)

  const c1 = questionOf('c1')
  follows(
    scripted([
      [tool(DATA_TOOL.describe, {})],
      [tool(DATA_TOOL.query, { sql: MISSING_TABLE })],
      [tool(DATA_TOOL.query, { sql: SQL.c1 })],
      [said('Pronto.')],
    ]),
  )
  const recovered = scoreOf({ question: 1, ...(await turnOf(t, on, c1)), right: false })
  assert.equal(recovered.firstQueryFailed, true, 'the first failed and the second read')
  assert.equal(recovered.errors, 1)

  follows(
    scripted([
      [tool(DATA_TOOL.describe, {})],
      [tool(DATA_TOOL.query, { sql: SQL.c1 })],
      [tool(DATA_TOOL.query, { sql: MISSING_TABLE })],
      [said('Pronto.')],
    ]),
  )
  const spoiled = scoreOf({ question: 1, ...(await turnOf(t, on, c1)), right: false })
  assert.equal(spoiled.firstQueryFailed, false, 'the first read and a later one failed')
  assert.equal(spoiled.errors, 1)
})

test('o modelo de verdade, as perguntas do dado copiado: cada pergunta numa conversa nova, um JSON por pergunta', {
  timeout: 3_600_000,
}, async (t) => {
  if (REAL_MODEL === undefined) {
    t.skip(
      'opt-in: set CONEXUS_EVAL_REAL_MODEL to a folder (and the credential switch the other real cases use); firstmate runs it and attaches the scorecard JSONs',
    )
    return
  }
  const real = await subscribed(t, REAL_MODEL, EVAL_PROVIDER)
  assert.ok(real.matriz, 'the Sankhya connection is linked')
  const on: Place = {
    ...{ hub: real.hub, ana: real.ana, assistant: real.assistant },
    ...{ companyId: real.companyId, projectId: real.projectId, matriz: real.matriz },
    conversations: `${real.company}/projects/${real.projectId}/conversations`,
  }
  await releasing(
    t,
    on,
    { connectionId: on.matriz },
    ['vendas', 'vendedores', 'clientes'],
    questionOf('c6').released,
  )
  mkdirSync(REAL_MODEL, { recursive: true })
  const folder = mkdtempSync(join(REAL_MODEL, 'placar-copia-'))
  for (const asked of COPY_QUESTIONS) {
    await ending(on, asked.partial === true ? 'PARTIAL' : 'COMPLETE')
    const { parts, events } = await turnOf(t, on, asked)
    const right = judgedCopy(asked, parts)
    const card = scoreOf({ question: Number(asked.n.slice(1)), parts, events, right })
    writeFileSync(join(folder, `pergunta-${asked.n}.json`), JSON.stringify(card, null, 2))
  }
  assert.equal(readdirSync(folder).length, COPY_QUESTIONS.length)
  process.stdout.write(`placar em ${folder}\n`)
})
