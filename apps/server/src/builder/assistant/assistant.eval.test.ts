import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import { checks } from '@mastra/evals/checks'
import { PADARIA_SOL_MATRIZ, salesSankhya, soldBy } from '../../hub/connectors/test-sales.ts'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { BRUNO, call, memberOn } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { endOf, messagesOf, title, turnNotices } from '../conversation/test-conversation.ts'
import { assisting, created, READ, talking } from './test-assistant.ts'
import { EVAL_SET, HAND_OFF_CASES, ROUNDS, verdictOf } from './test-handoff.ts'
import { numbersFromReads } from './test-numbers.ts'
import type { Subscribed } from './test-real-model.ts'
import { checked, QUESTION, REAL_MODEL, subscribed, textOf } from './test-real-model.ts'

const SOLD_BY_SELLER =
  "SELECT V.APELIDO, ROUND(SUM(I.VLRTOT), 2) AS TOTAL FROM TGFCAB C JOIN TGFITE I ON I.NUNOTA = C.NUNOTA JOIN TGFVEN V ON V.CODVEND = C.CODVEND WHERE C.DTNEG BETWEEN '2026-09-01' AND '2026-09-30' GROUP BY V.APELIDO ORDER BY TOTAL DESC"
const SEPTEMBER = [...soldBy(PADARIA_SOL_MATRIZ, '2026-09').values()]
const BRL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** The connections the conversation's block names, as the model reads them; none is `[]`. */
function chosenIn(call: Sent): string[] {
  const listed = /Connections in this conversation: (.*)\.$/m.exec(call.system)?.[1] ?? 'none'
  return listed === 'none' ? [] : listed.split(', ').map((each) => each.replace(/ \(.*\)$/, ''))
}

/** The rows of the last read the model was given, as the tool answered them. */
function lastRows(call: Sent): { APELIDO: string; TOTAL: number }[] | undefined {
  for (const text of [...call.texts].reverse()) {
    if (!text.includes('"linhas"')) continue
    return Object(JSON.parse(text)).value.linhas
  }
  return undefined
}

/**
 * A model that does what the Assistant's setup gives it a way to do, and nothing else (as the
 * Builder's `obedient`): it reads a connection only when its block names it and it has
 * `connector_read`, then answers with what the read returned; a connection not named, or none,
 * it says so. It keys on those facts, not on the instructions' sentences.
 */
function reader() {
  return (call: Sent): Reply => {
    const titled = title(call)
    if (titled !== undefined) return titled
    const rows = lastRows(call)
    if (rows !== undefined) {
      const said = rows.map((row) => `${row.APELIDO} vendeu R$ ${BRL.format(row.TOTAL)}`)
      return { kind: 'text', text: `Em setembro: ${said.join(', ')}.` }
    }
    const asked = call.texts.at(-1) ?? ''
    const wanted = asked.includes('Filial') ? 'Filial' : 'Matriz'
    const chosen = chosenIn(call)
    if (chosen.length === 0) {
      return {
        kind: 'text',
        text: 'Esta conversa não tem sistema escolhido: escolha um na barra da conversa, ou ligue um em Integrações.',
      }
    }
    if (!chosen.includes(wanted) || !call.tools.includes(READ)) {
      return { kind: 'text', text: `A ${wanted} não está nesta conversa.` }
    }
    const input = {
      connection: wanted,
      operation: 'sankhya.consultar',
      input: { sql: SOLD_BY_SELLER },
    }
    return { kind: 'blocks', blocks: [{ type: 'tool_use', name: READ, input }] }
  }
}

/** The parts of the conversation's last answer, as Mastra stored them, read through its route. */
async function answerParts(hub: Hub, person: Person, url: string): Promise<MastraMessagePart[]> {
  const messages = await messagesOf(hub, person, url)
  const asked = messages.findLastIndex((message) => message.role === 'person')
  return messages.slice(asked + 1).flatMap((message) => message.parts)
}

/** Mastra's own checks of the turn: the tool called and no tool erred, each a score of 1. */
function scored(parts: MastraMessagePart[], tool: string) {
  return checked(parts, [checks.calledTool(tool), checks.noToolErrors()])
}

test('as vendas por vendedor: o Assistente lê o Sankhya da Matriz, nenhuma ferramenta erra, e a conferência aprova cada número', async (t) => {
  const on = await assisting(t, reader(), await salesSankhya(t))
  const url = await created(on.hub, on.ana, on.assistant, { connections: [on.matriz] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say(QUESTION)), 'complete')
  const parts = await answerParts(on.hub, on.ana, url)
  assert.deepEqual(await scored(parts, READ), [1, 1])
  assert.deepEqual(numbersFromReads({ question: QUESTION, parts, truth: SEPTEMBER }), { ok: true })
  assert.match(textOf(parts), /JOAO vendeu R\$ 8\.072,70/)
})

test('a ligação de fora do Projeto: numa conversa do Projeto só com a Matriz, a Filial não é lida e a resposta diz que ela não está na conversa', async (t) => {
  const on = await assisting(t, reader(), await salesSankhya(t))
  const url = await created(on.hub, on.ana, on.assistant, {
    projectId: on.projectId,
    connections: [on.matriz, on.filial],
  })
  const asked = await (await talking(t, on.hub, on.ana, url)).say('Quanto a Filial vendeu ontem?')
  assert.equal(endOf(asked), 'complete')
  assert.ok(on.reads.every((read) => read.connectionId !== on.filial))
  const parts = await answerParts(on.hub, on.ana, url)
  assert.match(textOf(parts), /Filial não está nesta conversa/)
  assert.deepEqual(numbersFromReads({ question: 'ontem', parts, truth: [] }), { ok: true })
})

test('sem ligação: a conversa sem sistema escolhido diz isso e aponta a barra, sem chamar connector_read', async (t) => {
  const on = await assisting(t, reader(), await salesSankhya(t))
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say(QUESTION)), 'complete')
  const parts = await answerParts(on.hub, on.ana, url)
  assert.ok(parts.every((part) => part.type !== 'tool-invocation'))
  assert.match(textOf(parts), /barra/)
  assert.equal(on.reads.length, 0)
})
test('o modelo de verdade: as perguntas do roteiro sobre o dublê, cada uma numa conversa nova, e nenhuma resposta reprovada', {
  timeout: 1_800_000,
}, async (t) => {
  if (REAL_MODEL === undefined) {
    t.skip(
      'opt-in: set CONEXUS_EVAL_REAL_MODEL to a folder; firstmate opens the link the test writes there and writes back the sign-in code (step 24.1, criterion 11b)',
    )
    return
  }
  const on = await subscribed(t, REAL_MODEL)
  const asks = [
    { body: { connections: [on.matriz] }, question: QUESTION, truth: SEPTEMBER },
    { body: { connections: [] }, question: QUESTION, truth: [] },
    {
      body: { projectId: on.projectId, connections: [on.matriz] },
      question: 'Quanto a Filial vendeu em setembro?',
      truth: [],
    },
  ]
  for (const each of asks) {
    const url = await created(on.hub, on.ana, on.assistant, each.body)
    assert.equal(
      endOf(await (await talking(t, on.hub, on.ana, url)).say(each.question)),
      'complete',
    )
    const parts = await answerParts(on.hub, on.ana, url)
    const verdict = numbersFromReads({ question: each.question, parts, truth: each.truth })
    assert.deepEqual(verdict, { ok: true }, `${each.question}\n${textOf(parts)}`)
  }
})

test('o modelo de verdade passa ao Builder: cada caso do conjunto, numa conversa nova, certo na rodada única (step 24.3.2, critério 6, decisão de 2026-11-03)', {
  timeout: 10_800_000,
}, async (t) => {
  if (REAL_MODEL === undefined) {
    t.skip(
      'opt-in: set CONEXUS_EVAL_REAL_MODEL to a folder, and CONEXUS_EVAL_SET to tuning, held-out or all; firstmate opens the link the test writes there and writes back the sign-in code',
    )
    return
  }
  const on = await subscribed(t, REAL_MODEL)
  const cases = HAND_OFF_CASES.filter(
    (each) => EVAL_SET === 'all' || each.held === (EVAL_SET === 'held-out'),
  )
  const wrong: string[] = []
  for (let round = 1; round <= ROUNDS; round += 1) {
    for (const each of cases) {
      for (const why of await verdictOf(t, on, each)) wrong.push(`round ${round}, ${why}`)
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n\n'))
})

/** A turn that ends otherwise than complete says why: the turn's notices and the state of each model account, never a token. */
async function completed(
  on: Subscribed,
  who: Person,
  url: string,
  events: Parameters<typeof endOf>[0],
) {
  const end = endOf(events)
  if (end === 'complete') return
  const accounts = Object((await call(on.hub, who, 'GET', `${on.company}/model-accounts`)).json())
  const states = [...(accounts.company ?? []), ...(accounts.mine ?? [])].map(
    (each: { label: string; state: string }) => `${each.label}: ${each.state}`,
  )
  assert.fail(
    `o turno terminou em ${end}\navisos: ${JSON.stringify(await turnNotices(on.hub, who, url))}\ncontas do modelo: ${states.join('; ')}`,
  )
}

const SAVE = 'connector_note_save'
const TEACHING =
  'Na Matriz, o NUNOTA da tabela TGFCAB é o número da nota de venda. Anota isso no caderno.'
const OPT_IN =
  'opt-in: set CONEXUS_EVAL_REAL_MODEL to a folder; firstmate opens the link the test writes there and writes back the sign-in code, or CONEXUS_EVAL_CLAUDE_CREDENTIAL names a saved sign-in'

/** The real model's case of the caderno: the Hub signed in, and every tool call and the final text of a case kept beside the sign-in files, never in the repository. */
async function notebook(t: TestContext) {
  const folder = REAL_MODEL ?? ''
  const on = await subscribed(t, folder)
  function record(name: string, parts: MastraMessagePart[]) {
    const calls = parts.flatMap((part) =>
      part.type === 'tool-invocation' ? [part.toolInvocation] : [],
    )
    writeFileSync(
      join(folder, `caderno-${name}.json`),
      JSON.stringify({ calls, text: textOf(parts) }, null, 2),
    )
    return `${JSON.stringify(calls)}\n${textOf(parts)}`
  }
  return { on, record, body: { connections: [on.matriz] } }
}

test('o modelo de verdade: o caderno, a dona pede e o turno grava e diz o que anotou (step 24.3.5, critério 8)', {
  timeout: 1_800_000,
}, async (t) => {
  if (REAL_MODEL === undefined) return t.skip(OPT_IN)
  const { on, record, body } = await notebook(t)
  const owner = await created(on.hub, on.ana, on.assistant, body)
  await completed(on, on.ana, owner, await (await talking(t, on.hub, on.ana, owner)).say(TEACHING))
  const parts = await answerParts(on.hub, on.ana, owner)
  const seen = record('dona', parts)
  assert.deepEqual(await scored(parts, SAVE), [1, 1], `chamou e nenhuma ferramenta errou\n${seen}`)
  const notes = []
  for (const id of on.connections) {
    const page = await call(on.hub, on.ana, 'GET', `${on.company}/connections/${id}`)
    notes.push(...Object(page.json()).notes.map((each: object) => ({ connection: id, ...each })))
  }
  assert.equal(
    notes.length,
    1,
    `esperava uma anotação nas ligações da empresa, vieram ${notes.length}\n${seen}`,
  )
  const [note] = notes
  assert.equal(note.connection, on.matriz, `a anotação foi para outra ligação\n${seen}`)
  assert.ok(note.provedRows > 0, `a prova não voltou linhas\n${seen}`)
  assert.equal(note.writtenBy, 'Ana Lima')
  assert.match(textOf(parts), /NUNOTA/, `a resposta não diz o que anotou\n${seen}`)
})

test('o modelo de verdade: o caderno, a conversa em que a pessoa não ensina nem pede anotação não grava', {
  timeout: 1_800_000,
}, async (t) => {
  if (REAL_MODEL === undefined) return t.skip(OPT_IN)
  const { on, record, body } = await notebook(t)
  const idle = await created(on.hub, on.ana, on.assistant, body)
  const chat = 'O que é o NUNOTA no Sankhya?'
  await completed(on, on.ana, idle, await (await talking(t, on.hub, on.ana, idle)).say(chat))
  const talked = await answerParts(on.hub, on.ana, idle)
  const talk = record('sem-ensino', talked)
  assert.deepEqual(await checked(talked, [checks.didNotCall(SAVE)]), [1], talk)
})

test('o modelo de verdade: o caderno, o membro pede e o turno termina com o texto e sem a ferramenta', {
  timeout: 1_800_000,
}, async (t) => {
  if (REAL_MODEL === undefined) return t.skip(OPT_IN)
  const { on, record, body } = await notebook(t)
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const his = await created(on.hub, bruno, on.assistant, body)
  await completed(on, bruno, his, await (await talking(t, on.hub, bruno, his)).say(TEACHING))
  const theirs = await answerParts(on.hub, bruno, his)
  const hers = record('membro', theirs)
  assert.deepEqual(await checked(theirs, [checks.didNotCall(SAVE)]), [1], hers)
  assert.match(textOf(theirs), /NUNOTA/, `o texto não traz o conceito\n${hers}`)
  assert.match(textOf(theirs), /SELECT/i, `o texto não traz a consulta\n${hers}`)
  assert.match(textOf(theirs), /TGFCAB/, `o texto não traz a tabela\n${hers}`)
})
