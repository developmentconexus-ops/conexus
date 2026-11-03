import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { ASSISTANT_TOOL, ProposedApp } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import { checks } from '@mastra/evals/checks'
import { z } from 'zod'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { post } from '../../hub/identity/test-hub.ts'
import { runsOf } from '../automations/test-automations.ts'
import { endOf, messagesOf } from '../conversation/test-conversation.ts'
import { created, talking } from './test-assistant.ts'
import { figuresFromReads } from './test-numbers.ts'
import type { Subscribed } from './test-real-model.ts'
import { checked, QUESTION, textOf } from './test-real-model.ts'

const APP = ASSISTANT_TOOL.proposeApp
const CHANGE = ASSISTANT_TOOL.proposeAppChange
const AUTOMATION = ASSISTANT_TOOL.proposeAutomation
/** The founder's request in phases, written again with invented words (step 24.3.2, case 1). */
const PHASED =
  'Quero um app para decidir o que comprar por giro e volume. Primeiro estude como se faz, depois veja o que o Sankhya permite medir, depois vamos planejar.'

/**
 * A case of the hand-off set (step 24.3.2): where it is asked, the person's turns, and what Mastra's
 * checks must score 1 over the conversation's parts. `held` marks the half kept out of sight while
 * the texts are tuned (Anthropic, "held-out test sets"): it runs only at the end.
 */
type HandOffCase = {
  n: number
  place: 'HOME' | 'PROJECT' | 'AUTOMATION'
  turns: readonly string[]
  called?: readonly string[]
  notCalled?: readonly string[]
  /** A hand-off accepted at most once over all the turns: no loop; a refused call does not count. */
  atMostOnce?: string
  /** The briefing of the case's proposal exists, is not empty and carries no figure of the reads. */
  briefed?: boolean
  held: boolean
}

export const HAND_OFF_CASES: readonly HandOffCase[] = [
  { n: 1, place: 'HOME', turns: [PHASED], called: [APP], briefed: true, held: false },
  { n: 2, place: 'HOME', turns: ['Quero um app de compras.'], called: [APP], held: true },
  {
    n: 3,
    place: 'HOME',
    turns: ['A gente anota as visitas aos clientes no papel, queria parar com isso.'],
    called: [APP],
    held: false,
  },
  {
    n: 4,
    place: 'HOME',
    turns: ['Quero que o time registre as devoluções num lugar só.'],
    called: [APP],
    held: true,
  },
  { n: 5, place: 'HOME', turns: [QUESTION], notCalled: [APP, AUTOMATION], held: false },
  {
    n: 6,
    place: 'HOME',
    turns: ['Me mande uma planilha com o estoque parado.'],
    called: [ASSISTANT_TOOL.showFile],
    notCalled: [APP],
    held: true,
  },
  {
    n: 7,
    place: 'HOME',
    turns: ['Quais produtos estão com estoque abaixo do ponto de pedido hoje?'],
    notCalled: [APP],
    held: false,
  },
  {
    n: 8,
    place: 'HOME',
    turns: ['Todo dia às 8h me diga o que comprar.'],
    called: [AUTOMATION],
    notCalled: [APP],
    held: true,
  },
  {
    n: 9,
    place: 'HOME',
    turns: ['O que o Conexus faz?'],
    notCalled: [APP, AUTOMATION],
    held: false,
  },
  {
    n: 10,
    place: 'HOME',
    turns: [PHASED, 'Ok, obrigado.', 'E o fornecedor Moinho Bom entrega em quantos dias?'],
    atMostOnce: APP,
    held: true,
  },
  {
    n: 11,
    place: 'PROJECT',
    turns: ['Quero que o app mostre também a cobertura em dias.'],
    called: [CHANGE],
    held: false,
  },
  {
    n: 12,
    place: 'PROJECT',
    turns: ['Quanto esse app registrou ontem?'],
    notCalled: [CHANGE],
    held: true,
  },
  // The code offers neither hand-off in an automation's run, so this case is the end-to-end
  // regression of that, not a decision of the model.
  {
    n: 13,
    place: 'AUTOMATION',
    turns: ['O relatório de vendas de ontem, por vendedor.'],
    notCalled: [APP, CHANGE],
    held: false,
  },
]

/** Which half runs: `tuning` while the texts are adjusted, `held-out` at the end, or `all`; another word throws. */
export const EVAL_SET = z
  .enum(['tuning', 'held-out', 'all'])
  // biome-ignore lint/style/noProcessEnv: the choice of the opt-in case's half, not the app's configuration
  .parse(process.env.CONEXUS_EVAL_SET ?? 'tuning')
export const ROUNDS = 3
const RUN_WAIT_MS = 600_000

/** Every part the Assistant answered in the conversation, over all its turns. */
async function answeredParts(hub: Hub, person: Person, url: string): Promise<MastraMessagePart[]> {
  const messages = await messagesOf(hub, person, url)
  return messages.filter((each) => each.role !== 'person').flatMap((each) => each.parts)
}

/** The results the parts hold of one tool's calls, in order. */
function resultsOf(parts: MastraMessagePart[], name: string): unknown[] {
  return parts.flatMap((part) => {
    const call = Object(part).toolInvocation
    return part.type === 'tool-invocation' && call?.toolName === name ? [call.result] : []
  })
}

/**
 * The proposals the tool accepted, each with its briefing: a call Mastra or the tool refused is no
 * hand-off.
 */
function acceptedOf(parts: MastraMessagePart[], name: string) {
  return resultsOf(parts, name).flatMap((result) => {
    const proposal = ProposedApp.safeParse(result)
    return proposal.success && proposal.data.briefing !== undefined ? [proposal.data] : []
  })
}

const HAND_OFFS: readonly string[] = [APP, CHANGE]

/** An automation of the company with the case's prompt, run by hand, and its conversation once the run ended. */
async function automationConversation(on: Subscribed, prompt: string): Promise<string> {
  const automations = `${on.company}/automations`
  const body = {
    ...{ name: 'Relatório', prompt, connections: [on.matriz] },
    cadence: { kind: 'DAILY', time: '07:00' },
  }
  const made = await post(on.hub, on.ana, automations, body, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  const url = `${automations}/${String(Object(made.json()).automation.id)}`
  const ran = await post(on.hub, on.ana, `${url}/run`, {})
  assert.equal(ran.statusCode, 202, ran.body)
  const runId = String(Object(ran.json()).runId)
  for (let waited = 0; waited < RUN_WAIT_MS; waited += 1000) {
    const { runs } = await runsOf(on.hub, on.ana, url)
    const run = runs.find((each) => each.runId === runId)
    if (run !== undefined && run.state.kind !== 'RUNNING') {
      assert.equal(run.state.kind, 'DONE', JSON.stringify(run.state))
      return `${on.assistant}/${String(Object(run.state).conversationId)}`
    }
    await sleep(1000)
  }
  throw new Error(`The automation's run ${runId} did not end in ten minutes.`)
}

/** What went wrong in one run of a case, or nothing. */
export async function verdictOf(
  t: TestContext,
  on: Subscribed,
  each: HandOffCase,
): Promise<string[]> {
  let url: string
  const ended: string[] = []
  if (each.place === 'AUTOMATION') {
    url = await automationConversation(on, each.turns[0] ?? '')
  } else {
    const place = each.place === 'PROJECT' ? { projectId: on.projectId } : {}
    url = await created(on.hub, on.ana, on.assistant, { ...place, connections: [on.matriz] })
    const { say } = await talking(t, on.hub, on.ana, url)
    for (const [at, turn] of each.turns.entries()) {
      const end = endOf(await say(turn))
      if (end !== 'complete') ended.push(`turn ${at + 1} ended ${end}`)
    }
  }
  const parts = await answeredParts(on.hub, on.ana, url)
  const wrong: string[] = [...ended]
  const expected = [
    ...(each.called ?? []).map((name) => ({
      why: `did not call ${name}`,
      check: checks.calledTool(name),
    })),
    ...(each.notCalled ?? []).map((name) => ({
      why: `called ${name}`,
      check: checks.didNotCall(name),
    })),
  ]
  const scores = await checked(
    parts,
    expected.map((one) => one.check),
  )
  wrong.push(...expected.filter((_, at) => scores[at] !== 1).map((one) => one.why))
  for (const name of (each.called ?? []).filter((one) => HAND_OFFS.includes(one))) {
    if (acceptedOf(parts, name).length === 0) wrong.push(`no accepted ${name} with a briefing`)
  }
  if (each.atMostOnce !== undefined && acceptedOf(parts, each.atMostOnce).length > 1) {
    wrong.push(`proposed ${each.atMostOnce} more than once`)
  }
  if (each.briefed === true) {
    const [proposal] = acceptedOf(parts, APP)
    const content = proposal?.briefing?.content ?? ''
    if (content.trim() === '') wrong.push('no briefing with the proposal')
    const figure = figuresFromReads(content, parts)
    if (figure !== undefined) wrong.push(`the briefing carries the figure ${figure}`)
  }
  return wrong.map((why) => `case ${each.n}: ${why}\n${textOf(parts)}`)
}
