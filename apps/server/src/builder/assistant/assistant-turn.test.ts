import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { CARLA, call, memberOn, post } from '../../hub/identity/test-hub.ts'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { testCliProxy } from '../../platform/test-cliproxy-binary.ts'
import { queued, withOwnerLock } from '../../platform/test-database.ts'
import {
  answeredOf,
  asked,
  conversing,
  endOf,
  holding,
  hubBeside,
  PARTIAL,
  sent,
  sessionUrl,
  streamOf,
  title,
} from '../conversation/test-conversation.ts'
import { failuresOf } from '../conversation/test-parts.ts'
import { created, talking } from './test-assistant.ts'

/** Whether the call is the Assistant's: its fixed message opens its system. */
function isAssistant(call: Sent): boolean {
  return call.system.startsWith('You are the Conexus assistant.')
}

/**
 * A company with one model account whose Assistant answers what `next` holds (once, when `once`),
 * else `Pronto.`; the Builder always `Pronto.`.
 */
async function oneAccount(t: TestContext) {
  const next: { reply: Reply | undefined; once?: boolean } = { reply: undefined }
  const on = await conversing(t, (call) => {
    const titled = title(call)
    if (titled !== undefined) return titled
    if (!isAssistant(call)) return { kind: 'text', text: 'Pronto.' }
    const reply = next.reply ?? { kind: 'text', text: 'Pronto.' }
    if (next.once) next.reply = undefined
    return reply
  })
  const assistant = `/api/companies/${on.companyId}/assistant/conversations`
  const url = await created(on.hub, on.ana, assistant, { connections: [] })
  const conversation = await talking(t, on.hub, on.ana, url)
  /** The next turns start: the Assistant's in the same conversation, and the Builder's, each to its end. */
  async function bothStart(label: string) {
    assert.equal(endOf(await conversation.say('E agora?')), 'complete', label)
    const builder = await asked(t, { hub: on.hub, person: on.ana, conversations: on.conversations })
    assert.equal(endOf(builder.events), 'complete', label)
  }
  /** The question sent, without waiting for its turn: the test reads the stream itself. */
  async function ask(content: string) {
    const sentIt = await sent(on.hub, on.ana, url, content)
    assert.equal(sentIt.statusCode, 200, sentIt.body)
  }
  return { ...on, url, next, conversation, bothStart, ask }
}

test('a conta: um turno do Assistente e um do Builder da mesma pessoa correm juntos', async (t) => {
  const on = await oneAccount(t)
  const held = holding(t)
  on.next.reply = held.reply
  await on.ask('Uma pergunta longa')
  assert.equal(await on.conversation.stream.text(), PARTIAL)
  const builder = await asked(t, { hub: on.hub, person: on.ana, conversations: on.conversations })
  assert.equal(endOf(builder.events), 'complete')
  held.release()
  assert.equal(endOf(await on.conversation.stream.turn()), 'complete')
})

test('a conta: sem conta que responda, o turno do Assistente termina com a frase de hoje', async (t) => {
  const on = await oneAccount(t)
  on.next.reply = { kind: 'refuse', status: 401 }
  const events = await on.conversation.say('Quanto vendemos?')
  assert.equal(endOf(events), 'error')
  assert.deepEqual(failuresOf(events), ['MODEL_NO_ACCOUNT'])
})

test('o fim do turno solta a conta: depois de um turno que acaba, um que falha e um parado pela pessoa, o seguinte e um do Builder começam', async (t) => {
  const on = await oneAccount(t)
  assert.equal(endOf(await on.conversation.say('Oi')), 'complete')
  await on.bothStart('acabou')

  on.next.reply = { kind: 'refuse', status: 500 }
  assert.equal(endOf(await on.conversation.say('Falhe')), 'error')
  on.next.reply = undefined
  await on.bothStart('falhou')

  const held = holding(t)
  on.next.reply = held.reply
  await on.ask('Pare no meio')
  assert.equal(await on.conversation.stream.text(), PARTIAL)
  const stopped = await post(on.hub, on.ana, `${sessionUrl(on.url)}/abort`, {})
  assert.equal(stopped.statusCode, 200, stopped.body)
  assert.equal(endOf(await on.conversation.stream.turn()), 'aborted')
  on.next.reply = undefined
  held.release()
  await on.bothStart('parado')
})

test('a chamada sem argumentos: uma ferramenta guardada sem argumentos é refeita como {} e a conversa segue', async (t) => {
  const said = t.mock.method(console, 'error', () => undefined)
  const on = await oneAccount(t)
  on.next.once = true
  on.next.reply = {
    kind: 'blocks',
    blocks: [{ type: 'tool_use', name: 'conexus_overview', input: '{"cut' }],
  }
  const events = await on.conversation.say('Como está a empresa?')
  assert.deepEqual(failuresOf(events), [])
  assert.equal(endOf(await on.conversation.say('E agora?')), 'complete')
  assert.equal(said.mock.calls[0]?.arguments[0], 'Error converting tool call input to JSON')
  const replayed = on.anthropic.sent.filter((call) => call.stream && isAssistant(call)).at(-1)
  assert.deepEqual(replayed?.toolUses, [{ name: 'conexus_overview', input: {} }])
  const stored = (await answeredOf(on.hub, on.ana, on.url)).at(-1)
  assert.equal(stored?.role, 'builder')
})

/** Whether the process `pid` still runs. */
function alive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/** Waits, at most `ms`, until `done` holds; whether it did. */
async function within(ms: number, done: () => boolean | Promise<boolean>): Promise<boolean> {
  for (const stop = Date.now() + ms; Date.now() < stop; await sleep(20)) {
    if (await done()) return true
  }
  return done()
}

/**
 * A company whose only conversation account is Google's, through the CLIProxy double, whose process
 * stops 50 ms after its last call ends; Anthropic answers only the titles.
 */
async function googleOnly(t: TestContext) {
  const on = await conversing(
    t,
    (call) => title(call) ?? { kind: 'refuse', status: 500 },
    (config) => ({ ...config, cliProxy: { ...config.cliProxy, idleSeconds: 0.05 } }),
  )
  await on.hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'google_cliproxy')`,
    [on.companyId],
  )
  const double = testCliProxy()
  for (const file of ['mode', 'runs', 'asked']) rmSync(join(double.control, file), { force: true })
  t.after(() => rmSync(join(double.control, 'recording'), { force: true }))
  const signIns = `/api/companies/${on.companyId}/model-account-sign-ins`
  const opened = await post(on.hub, on.ana, signIns, {
    owner: 'company',
    kind: 'google_cliproxy',
    label: 'Google',
  })
  assert.equal(opened.statusCode, 201, opened.body)
  const { url: address, signInId } = Object(opened.json())
  const state = String(new URL(address).searchParams.get('state'))
  const code = `http://localhost:51121/oauth-callback?state=${state}&code=c-1`
  const linked = await post(on.hub, on.ana, `${signIns}/${signInId}`, { code })
  assert.equal(linked.statusCode, 201, linked.body)
  const assistant = `/api/companies/${on.companyId}/assistant/conversations`
  function lines(file: string): string[] {
    const path = join(double.control, file)
    return existsSync(path) ? readFileSync(path, 'utf8').trim().split('\n') : []
  }
  /**
   * The person's question on the conversation at `url`, answered with the recording `name`, whole or
   * cut and left open, once no process of the account runs: the pid of the process its turn opened,
   * once its model call reached it, so the turn holds the account.
   */
  async function asking(
    person: Person,
    url: string,
    name: 'google-thinking' | 'google-abort',
    hub: Hub = on.hub,
  ): Promise<number> {
    const pids = lines('runs').map((run) => Number(run.split(' ')[0]))
    assert.ok(await within(5_000, () => pids.every((pid) => !alive(pid))), 'no process runs')
    writeFileSync(join(double.control, 'recording'), name)
    const before = { runs: lines('runs').length, asked: lines('asked').length }
    const asked = await sent(hub, person, url, 'Quanto vendemos?')
    assert.equal(asked.statusCode, 200, asked.body)
    const reached = await within(10_000, () => {
      return lines('runs').length > before.runs && lines('asked').length > before.asked
    })
    assert.ok(reached, 'the turn opened a process and called through it')
    return Number(lines('runs').at(-1)?.split(' ')[0])
  }
  /** A new conversation of `person` on Gemini, its first answer whole, its stream open. */
  async function opening(person: Person) {
    const body = { model: 'google/gemini-3.5-flash-lite', connections: [] }
    const url = await created(on.hub, person, assistant, body)
    const stream = await streamOf(on.hub, person, url)
    t.after(() => stream.close())
    const pid = await asking(person, url, 'google-thinking')
    assert.equal(endOf(await stream.turn()), 'complete')
    return { url, stream, pid }
  }
  /** The account's next process lists no model, so a turn waits for it as it picks the account, until `go`. */
  function holdingStart() {
    const hold = join(double.control, 'hold')
    writeFileSync(hold, '')
    t.after(() => rmSync(hold, { force: true }))
    return { go: () => rmSync(hold), started: () => lines('runs') }
  }
  return { ...on, asking, opening, holdingStart, runs: () => lines('runs') }
}

test('o fim do turno solta o processo do Google: depois de um turno que acaba, de um parado pela pessoa e de uma conversa apagada no meio, o processo sai', async (t) => {
  const on = await googleOnly(t)
  const ana = await on.opening(on.ana)
  assert.ok(await within(5_000, () => !alive(ana.pid)), 'a turn that ended lets it go')

  const running = await on.asking(on.ana, ana.url, 'google-abort')
  const stopped = await post(on.hub, on.ana, `${sessionUrl(ana.url)}/abort`, {})
  assert.equal(stopped.statusCode, 200, stopped.body)
  assert.equal(endOf(await ana.stream.turn()), 'aborted')
  assert.ok(await within(5_000, () => !alive(running)), 'a turn stopped by Parar lets it go')

  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const hers = await on.opening(carla)
  const deleted = await on.asking(carla, hers.url, 'google-abort')
  const members = `/api/companies/${on.companyId}/members`
  assert.equal((await call(on.hub, on.ana, 'DELETE', `${members}/${carla.id}`)).statusCode, 204)
  assert.ok(
    await within(5_000, () => !alive(deleted)),
    'a conversation deleted mid-turn lets it go',
  )
})

test('Parar enquanto o turno escolhe a conta: a escolha que termina depois do fim não segura o processo do Google', async (t) => {
  const on = await googleOnly(t)
  const ana = await on.opening(on.ana)
  assert.ok(await within(5_000, () => !alive(ana.pid)))
  const before = on.holdingStart()
  const runs = before.started().length
  assert.equal((await sent(on.hub, on.ana, ana.url, 'Pare antes')).statusCode, 200)
  assert.ok(await within(10_000, () => before.started().length > runs), 'the pick opened a process')
  const pid = Number(before.started().at(-1)?.split(' ')[0])
  const stopped = await post(on.hub, on.ana, `${sessionUrl(ana.url)}/abort`, {})
  assert.equal(stopped.statusCode, 200, stopped.body)
  assert.equal(endOf(await ana.stream.turn()), 'aborted')
  before.go()
  assert.ok(await within(5_000, () => !alive(pid)), 'the pick that ended after the turn lets go')
})

test('Parar enquanto o turno é tomado: o Mastra só termina o run depois que o turno foi tomado, a escolha não roda, nenhum processo fica, e a pergunta seguinte responde (F16)', async (t) => {
  const on = await googleOnly(t)
  const ana = await on.opening(on.ana)
  assert.ok(await within(5_000, () => !alive(ana.pid)))
  const before = on.runs().length
  // The turn is taken from the company's memory models: while they are locked, `take` waits.
  const lock = 'lock table builder.observational_memory_models in access exclusive mode'
  await withOwnerLock(on.hub.test, lock, [], async (release) => {
    assert.equal((await sent(on.hub, on.ana, ana.url, 'Pare antes')).statusCode, 200)
    await queued(on.hub.test, 1)
    const stopped = await post(on.hub, on.ana, `${sessionUrl(ana.url)}/abort`, {})
    assert.equal(stopped.statusCode, 200, stopped.body)
    // Mastra ends the run only once its input processors return: the take finishes after Parar.
    await release()
  })
  assert.equal(endOf(await ana.stream.turn()), 'aborted')
  assert.equal(on.runs().length, before, 'the stopped run picked no account')
  const next = await on.asking(on.ana, ana.url, 'google-thinking')
  assert.equal(endOf(await ana.stream.turn()), 'complete')
  assert.ok(await within(5_000, () => !alive(next)), 'and the next turn lets go of its own')
})

test('o fim do Hub solta a conta: o turno do Assistente cortado pelo fim do Hub, no mesmo processo, deixa o processo do Google sair (F14, 16e)', {
  timeout: 60_000,
}, async (t) => {
  const on = await googleOnly(t)
  const stopping = await hubBeside(t, on.hub)
  const assistant = `/api/companies/${on.companyId}/assistant/conversations`
  const body = { model: 'google/gemini-3.5-flash-lite', connections: [] }
  const url = await created(stopping, on.ana, assistant, body)
  const stream = await streamOf(stopping, on.ana, url)
  t.after(() => stream.close())
  const pid = await on.asking(on.ana, url, 'google-abort', stopping)
  const stopped = stopping.close(300)
  const events = await stream.turn()
  assert.equal(endOf(events), 'aborted')
  assert.deepEqual(failuresOf(events), ['HUB_UPDATED'])
  await stopped
  assert.ok(await within(5_000, () => !alive(pid)), 'the turn the Hub cut lets go of its process')
})
