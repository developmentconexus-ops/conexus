import assert from 'node:assert/strict'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { MastraDBMessage } from '@mastra/core/agent'
import type { MastraMessagePart } from '@mastra/core/agent-controller'
import type { ScorerRun, ScorerRunInputForAgent, ScorerRunOutputForAgent } from '@mastra/core/evals'
import { z } from 'zod'
import { linkSankhya, testOf } from '../../hub/connectors/test-connections.ts'
import { salesSankhya } from '../../hub/connectors/test-sales.ts'
import {
  ANA_OWNER,
  call,
  hubWithLog,
  personOn,
  plantCompany,
  post,
} from '../../hub/identity/test-hub.ts'
import { publishedApp } from './test-assistant.ts'

/** The question of the step 24.1 script, over the double's data. */
export const QUESTION = 'Quanto a Padaria Sol vendeu em setembro por vendedor?'

export function textOf(parts: MastraMessagePart[]): string {
  return parts.flatMap((part) => (part.type === 'text' ? [part.text] : [])).join('\n')
}

/** Any of Mastra's checks over an agent's answer: they differ only in their id and steps. */
type Check = {
  run(run: ScorerRun<ScorerRunInputForAgent, ScorerRunOutputForAgent>): Promise<{ score?: number }>
}

/** The score of each of Mastra's checks over the parts, as one answer. */
export async function checked(parts: MastraMessagePart[], scorers: readonly Check[]) {
  const output: MastraDBMessage[] = [
    { id: 'answer', role: 'assistant', createdAt: new Date(), content: { format: 2, parts } },
  ]
  const input = {
    inputMessages: [],
    rememberedMessages: [],
    systemMessages: [],
    taggedSystemMessages: {},
  }
  return Promise.all(scorers.map(async (scorer) => (await scorer.run({ input, output })).score))
}

/** The model the real cases run on: the least the company uses (founder, 2026-11-03: "no minimo sonnet 5.5 low"). */
const REAL_MODEL_CHOICE = { model: 'anthropic/claude-sonnet-5-5', effort: 'low' }

/** Where firstmate runs the real model's case: the authorize link goes there, and the sign-in code comes back there. */
// biome-ignore lint/style/noProcessEnv: the switch of this one opt-in case, not the app's configuration
export const REAL_MODEL = process.env.CONEXUS_EVAL_REAL_MODEL

/** The sign-in code firstmate writes after opening the link, read once and deleted; never printed. */
async function codeFrom(folder: string): Promise<string> {
  const path = join(folder, 'code.txt')
  for (let waited = 0; waited < 600; waited += 1) {
    if (existsSync(path)) {
      const code = readFileSync(path, 'utf8').trim()
      rmSync(path)
      return code
    }
    await sleep(1000)
  }
  throw new Error('No sign-in code arrived in ten minutes.')
}

/** Our own file of the sign-in the Hub kept (`access`, `refresh`, `expiresAt` in ms), named by the switch; never printed. */
// biome-ignore lint/style/noProcessEnv: the switch of this one opt-in case, not the app's configuration
const LOGIN_FILE = process.env.CONEXUS_EVAL_CLAUDE_CREDENTIAL
const EARLY_MS = 300_000
const Login = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1),
  expiresAt: z.number(),
})
type Login = z.infer<typeof Login>

function keptLogin(): Login | undefined {
  if (LOGIN_FILE === undefined || !existsSync(LOGIN_FILE)) return undefined
  return Login.parse(JSON.parse(readFileSync(LOGIN_FILE, 'utf8')))
}

/**
 * The vendor's token calls while the Hub signs in and renews: with a kept login, the first trade
 * of the code is answered with it, and every token the vendor gives (the trade or a renewal) is
 * written back to the file (mode 0600). Every other call goes through; the real `fetch` returns
 * when the test ends.
 */
function keeping(t: TestContext, file: string, kept: Login | undefined) {
  const real = globalThis.fetch
  let answered = kept === undefined
  globalThis.fetch = async (input, init) => {
    const target = String(input instanceof Request ? input.url : input)
    if (!target.includes('/v1/oauth/token')) return real(input, init)
    if (!answered && kept !== undefined) {
      answered = true
      return Response.json({
        access_token: kept.access,
        refresh_token: kept.refresh,
        expires_in: Math.max(1, (kept.expiresAt - Date.now() + EARLY_MS) / 1000),
      })
    }
    const response = await real(input, init)
    if (response.ok) {
      const reply = z
        .object({
          access_token: z.string(),
          refresh_token: z.string(),
          expires_in: z.number(),
        })
        .safeParse(await response.clone().json())
      if (reply.success) {
        const next: Login = {
          access: reply.data.access_token,
          refresh: reply.data.refresh_token,
          expiresAt: Date.now() + reply.data.expires_in * 1000 - EARLY_MS,
        }
        writeFileSync(file, JSON.stringify(next), { mode: 0o600 })
      }
    }
    return response
  }
  t.after(() => {
    globalThis.fetch = real
  })
}

/** Without a kept login: the link goes to the folder and the code comes back there. */
async function linkCode(folder: string, url: string): Promise<string> {
  writeFileSync(join(folder, 'authorize-url.txt'), `${url}\n`)
  return codeFrom(folder)
}

/** A Hub that calls the real model, through a Claude subscription signed in by the routes, as a person signs in. */
export async function subscribed(t: TestContext, folder: string) {
  const sankhya = await salesSankhya(t)
  const hub = await hubWithLog(t, (config) => ({
    ...config,
    connectorOrigins: new Map([['sankhya', sankhya.origin]]),
  }))
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const company = `/api/companies/${companyId}`
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'claude_subscription')`,
    [companyId],
  )
  const body = { owner: 'company', kind: 'claude_subscription', label: 'Assinatura' }
  const opened = await post(hub, ana, `${company}/model-account-sign-ins`, body)
  assert.equal(opened.statusCode, 201, opened.body)
  const { url, signInId } = Object(opened.json())
  const kept = keptLogin()
  if (LOGIN_FILE !== undefined) keeping(t, LOGIN_FILE, kept)
  const code =
    kept === undefined
      ? await linkCode(folder, url)
      : `saved#${new URL(url).searchParams.get('state')}`
  const linked = await post(hub, ana, `${company}/model-account-sign-ins/${signInId}`, { code })
  assert.equal(linked.statusCode, 201, linked.body)
  const model = REAL_MODEL_CHOICE
  assert.equal((await call(hub, ana, 'PUT', `${company}/default-model`, model)).statusCode, 200)
  const connections = `${company}/connections`
  const ids = []
  for (const [name, credential] of [
    ['Matriz', sankhya.matriz],
    ['Filial', sankhya.filial],
  ] as const) {
    const made = await linkSankhya(hub, ana, connections, credential, undefined, name)
    const id = String(Object(made.json()).connection.id)
    assert.equal(Object((await testOf(hub, ana, connections, id)).json()).result, 'WORKING')
    ids.push(id)
  }
  const projected = await post(hub, ana, `${company}/projects`, { name: 'Vendas' })
  const projectId = String(Object(projected.json()).project.id)
  // Cases 11 and 12 talk about the Projeto's app, so it has one.
  await publishedApp(hub, { companyId, projectId, personId: ana.id })
  const grant = `${company}/projects/${projectId}/connections/${ids[0]}`
  assert.equal((await call(hub, ana, 'PUT', grant)).statusCode, 200)
  return {
    ...{ hub, ana, company, assistant: `${company}/assistant/conversations` },
    ...{ matriz: ids[0], projectId, companyId, connections: ids },
  }
}

export type Subscribed = Awaited<ReturnType<typeof subscribed>>
