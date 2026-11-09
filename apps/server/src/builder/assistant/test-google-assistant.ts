import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { post } from '../../hub/identity/test-hub.ts'
import { testCliProxy } from '../../platform/test-cliproxy-binary.ts'
import { conversing, endOf, sent, streamOf, title } from '../conversation/test-conversation.ts'
import { created } from './test-assistant.ts'

/** Whether the process `pid` still runs. */
export function alive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

/** Waits, at most `ms`, until `done` holds; whether it did. */
export async function within(ms: number, done: () => boolean | Promise<boolean>): Promise<boolean> {
  for (const stop = Date.now() + ms; Date.now() < stop; await sleep(20)) {
    if (await done()) return true
  }
  return done()
}

/**
 * A company whose only conversation account is Google's, through the CLIProxy double, whose process
 * stops 50 ms after its last call ends; Anthropic answers only the titles.
 */
export async function googleOnly(t: TestContext) {
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
    question = 'Quanto vendemos?',
  ): Promise<number> {
    const pids = lines('runs').map((run) => Number(run.split(' ')[0]))
    assert.ok(await within(5_000, () => pids.every((pid) => !alive(pid))), 'no process runs')
    writeFileSync(join(double.control, 'recording'), name)
    const before = { runs: lines('runs').length, asked: lines('asked').length }
    const asked = await sent(hub, person, url, question)
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
