import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import { MailApiUrl } from '../../platform/config.ts'
import { openMastraPool } from '../../platform/database.ts'
import type { Anthropic, Reply, Sent } from '../../platform/test-anthropic.ts'
import { silent } from '../../platform/test-database.ts'
import { mailServer } from '../../platform/test-mail.ts'
import { assisting } from '../assistant/test-assistant.ts'
import { hubBeside } from '../conversation/test-beside.ts'
import { title } from '../conversation/test-conversation.ts'
import type { tool } from '../conversation/test-questions.ts'

type Block = ReturnType<typeof tool>

/** A scheduler that ticks fast enough for a test to wait for a minute's fire, and a turn's budget. */
export const TEST_CLOCK = { schedulerTickMs: 200, turnMs: 60_000 }
/** How long a test waits for a run to end: a fire within the next minute, then its turn. */
const RUN_DEADLINE_MS = 90_000

export type Summary = {
  id: string
  name: string
  prompt: string
  cadence: { kind: string; time: string }
  projectId: string | null
  connections: { connectionId: string; name: string; chosen: boolean }[]
  state: 'ACTIVE' | 'PAUSED'
  nextRunAt: string | null
  createdAt: string
}
export type Run = {
  runId: string
  firedAt: string
  trigger: 'SCHEDULED' | 'MANUAL'
  state: { kind: string; conversationId?: string | null; code?: string; reason?: string }
}
type Next = { kind: 'END' } | { kind: 'MORE'; page: string }

/**
 * The Assistant's test company (`assisting`), with the automations' clock of `turnMs`, and its mail
 * going to a fake of the provider (`mail`).
 */
export async function automating(
  t: TestContext,
  model: Block[][] | Anthropic['answer'] = [],
  turnMs = TEST_CLOCK.turnMs,
) {
  const mail = await mailServer(t)
  const on = await assisting(t, model, undefined, (config) => ({
    ...config,
    mailApiUrl: MailApiUrl.parse(mail.url),
    automationClock: { ...TEST_CLOCK, turnMs },
  }))
  return { ...on, mail, automations: `${on.company}/automations` }
}

/** A model answering the title call, and the Assistant's calls with `next`'s replies in order, then `Pronto.`. */
export function answering(next: Reply[]) {
  return (asked: Sent): Reply => title(asked) ?? next.shift() ?? { kind: 'text', text: 'Pronto.' }
}

/**
 * A second Hub on a Mastra pool of its own: `die` ends that pool, as a process that dies loses its
 * connections, its runs and leases left behind.
 */
export async function dyingHub(t: TestContext, hub: Hub) {
  const pool = openMastraPool({ url: hub.test.mastraUrl, log: silent })
  const dying = await hubBeside(t, { ...hub, test: { ...hub.test, mastraPool: pool } })
  return { hub: dying, die: () => pool.end() }
}

/** The card's automation: Resumo de vendas, every day at 07:00, reading `connections`. */
export function salesSummary(connections: string[], change: object = {}) {
  return {
    name: 'Resumo de vendas',
    prompt: 'O resumo de vendas de ontem, por vendedor.',
    cadence: { kind: 'DAILY', time: '07:00' },
    connections,
    ...change,
  }
}

/** Each connection offered, by name, and whether it is chosen: as a person reads the list. */
export function choiceOf(connections: readonly { name: string; chosen: boolean }[]) {
  return connections.map((each) => [each.name, each.chosen])
}

export function automationOf(response: { json(): unknown }): Summary {
  return Object(response.json()).automation
}

/** A new automation of `person`; its summary. */
export async function created(hub: Hub, person: Person, url: string, body: object) {
  const made = await post(hub, person, url, body, randomUUID())
  assert.equal(made.statusCode, 201, made.body)
  return automationOf(made)
}

/** The automation's runs, a page at a time. */
export async function runsOf(hub: Hub, person: Person, url: string, page?: string) {
  const read = await call(hub, person, 'GET', `${url}/runs${page ? `?page=${page}` : ''}`)
  assert.equal(read.statusCode, 200, read.body)
  const runs: { runs: Run[]; next: Next } = Object(read.json())
  return runs
}

/** Runs the automation now; its run's id. */
export async function ranNow(hub: Hub, person: Person, url: string): Promise<string> {
  const ran = await post(hub, person, `${url}/run`, {})
  assert.equal(ran.statusCode, 202, ran.body)
  return String(Object(ran.json()).runId)
}

/** The run once its history says it is no longer `RUNNING` (or, with no id, the first run to end). */
export async function ended(hub: Hub, person: Person, url: string, runId?: string): Promise<Run> {
  const deadline = Date.now() + RUN_DEADLINE_MS
  while (Date.now() < deadline) {
    const { runs } = await runsOf(hub, person, url)
    const run = runs.find((each) => (runId === undefined ? true : each.runId === runId))
    if (run !== undefined && run.state.kind !== 'RUNNING') return run
    await sleep(100)
  }
  throw new Error(`the run ${runId ?? '(first)'} did not end within ${RUN_DEADLINE_MS} ms`)
}

/** The run once its history shows it `RUNNING` with its conversation open. */
export async function conversing(hub: Hub, person: Person, url: string, runId: string) {
  const deadline = Date.now() + RUN_DEADLINE_MS
  while (Date.now() < deadline) {
    const { runs } = await runsOf(hub, person, url)
    const run = runs.find((each) => each.runId === runId)
    if (run?.state.kind === 'RUNNING' && run.state.conversationId) return run
    await sleep(100)
  }
  throw new Error(`the run ${runId} did not open its conversation within ${RUN_DEADLINE_MS} ms`)
}

/** The time of day in São Paulo of the minute after now, as a cadence names it. */
export function nextMinute(now = new Date()): string {
  const at = new Date(Math.floor(now.getTime() / 60_000) * 60_000 + 60_000)
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(at)
}

/**
 * A cadence of every day at the next minute, with at least 10 s left before it: the creation lands
 * before the fire it waits for.
 */
export async function aMinuteAhead() {
  const left = 60_000 - (Date.now() % 60_000)
  if (left < 10_000) await sleep(left + 500)
  return { kind: 'DAILY', time: nextMinute() }
}

/** The next 07:00 in São Paulo (UTC-3, no daylight saving since 2019) after `now`. */
export function nextSeven(now: Date): string {
  const today = new Date(now)
  today.setUTCHours(10, 0, 0, 0)
  if (today.getTime() <= now.getTime()) today.setUTCDate(today.getUTCDate() + 1)
  return today.toISOString()
}
