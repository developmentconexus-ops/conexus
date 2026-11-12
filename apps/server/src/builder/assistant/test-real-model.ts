import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { TestContext } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { ATTEMPT_KEY_HEADER } from '@conexus/hub-api'
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
import type { Config } from '../../platform/config.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
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

/** The models the real cases run on: the least the company uses (founder, 2026-11-03: "no minimo sonnet 5.5 low"), and the ChatGPT subscription's model the step 24.4 measure ran on (the starter since 24.5, `openai/gpt-5.6-luna`; the old `openai/gpt-5` the endpoint refused for a ChatGPT account). */
const CHOICES = {
  claude: { model: 'anthropic/claude-sonnet-5-5', effort: 'low' },
  openai: { model: 'openai/gpt-5.6-luna', effort: 'low' },
}

/** Where firstmate runs the real model's case: the authorize link goes there, and the sign-in code comes back there. */
// biome-ignore lint/style/noProcessEnv: the switch of this one opt-in case, not the app's configuration
const env = process.env
export const REAL_MODEL = env.CONEXUS_EVAL_REAL_MODEL
/** The file of each vendor's kept login, named by its switch, outside the repository. */
const LOGIN_FILES = {
  claude: env.CONEXUS_EVAL_CLAUDE_CREDENTIAL,
  openai: env.CONEXUS_EVAL_OPENAI_CREDENTIAL,
}
export const OPENAI_LOGIN = LOGIN_FILES.openai

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

/** Our own file of the sign-in the Hub kept (`access`, `refresh`, `expiresAt` in ms, and the vendor's `idToken` when it gives one), named by the switch; never printed. */
const EARLY_MS = 300_000
const Login = z.object({
  access: z.string().min(1),
  refresh: z.string().min(1),
  expiresAt: z.number(),
  idToken: z.string().min(1).optional(),
})
type Login = z.infer<typeof Login>

function keptLogin(file: string | undefined): Login | undefined {
  if (file === undefined || !existsSync(file)) return undefined
  return Login.parse(JSON.parse(readFileSync(file, 'utf8')))
}

/** Where each vendor takes the sign-in's calls, so a kept login stands for them. */
type Vendor = {
  /** The vendor's token address, whose every reply is kept. */
  token: string
  /** Whether a call to it trades the sign-in's code, which the kept login answers. */
  trades(body: unknown): boolean
  /** The vendor's other sign-in calls the kept login answers, if any. */
  answers?(target: string): Response | undefined
}

const VENDORS = {
  claude: { token: '/v1/oauth/token', trades: () => true },
  openai: {
    token: '/oauth/token',
    trades: (body) => String(body).includes('grant_type=authorization_code'),
    // The device flow's start and poll, answered so a kept login never opens the vendor's page again.
    answers: (target) =>
      target.endsWith('/deviceauth/usercode')
        ? Response.json({ device_auth_id: 'kept', user_code: 'KEPT-LOGIN', interval: 1 })
        : target.endsWith('/deviceauth/token')
          ? Response.json({ authorization_code: 'kept', code_verifier: 'kept' })
          : undefined,
  },
} satisfies Record<'claude' | 'openai', Vendor>

/**
 * The vendor's token calls while the Hub signs in and renews: with a kept login, the first trade
 * of the code is answered with it, and every token the vendor gives (the trade or a renewal) is
 * written back to the file (mode 0600). Every other call goes through; the real `fetch` returns
 * when the test ends.
 */
function keeping(t: TestContext, file: string, kept: Login | undefined, vendor: Vendor) {
  const real = globalThis.fetch
  let answered = kept === undefined
  globalThis.fetch = async (input, init) => {
    const target = String(input instanceof Request ? input.url : input)
    if (kept !== undefined && !answered) {
      const other = vendor.answers?.(target)
      if (other !== undefined) return other
    }
    if (!target.includes(vendor.token)) return real(input, init)
    if (!answered && kept !== undefined && vendor.trades(init?.body)) {
      answered = true
      return Response.json({
        access_token: kept.access,
        refresh_token: kept.refresh,
        expires_in: Math.max(1, (kept.expiresAt - Date.now() + EARLY_MS) / 1000),
        ...(kept.idToken !== undefined && { id_token: kept.idToken }),
      })
    }
    const response = await real(input, init)
    if (response.ok) {
      const reply = z
        .object({
          access_token: z.string(),
          refresh_token: z.string(),
          expires_in: z.number(),
          id_token: z.string().optional(),
        })
        .safeParse(await response.clone().json())
      if (reply.success) {
        const idToken = reply.data.id_token ?? kept?.idToken
        const next: Login = {
          access: reply.data.access_token,
          refresh: reply.data.refresh_token,
          expiresAt: Date.now() + reply.data.expires_in * 1000 - EARLY_MS,
          ...(idToken !== undefined && { idToken }),
        }
        mkdirSync(dirname(file), { recursive: true })
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

type Hub = Parameters<typeof post>[0]
type Person = Parameters<typeof post>[1]

/**
 * The ChatGPT subscription's device sign-in, polled as the web does: without a kept login the page
 * and the user code go to the folder, and the person types the code there; the poll waits for it.
 */
async function polled(hub: Hub, ana: Person, company: string, folder: string, kept: boolean) {
  const signIns = `${company}/model-account-sign-ins`
  const opened = await post(hub, ana, signIns, {
    owner: 'company',
    kind: 'openai_codex',
    label: 'Assinatura',
  })
  assert.equal(opened.statusCode, 201, opened.body)
  const { url, userCode, signInId } = Object(opened.json())
  if (!kept) writeFileSync(join(folder, 'authorize-url.txt'), `${url}\ncódigo: ${userCode}\n`)
  for (let waited = 0; waited < 900; waited += 1) {
    const polling = await hub.app.inject({
      method: 'POST',
      url: `${signIns}/${signInId}/poll`,
      headers: { origin: TEST_ORIGIN, cookie: ana.cookie, [ATTEMPT_KEY_HEADER]: randomUUID() },
    })
    assert.equal(polling.statusCode, 200, polling.body)
    if (Object(polling.json()).status === 'linked') return
    await sleep(1000)
  }
  throw new Error('The ChatGPT sign-in was not finished in fifteen minutes.')
}

/** A Hub that calls the real model, through a Claude or ChatGPT subscription signed in by the routes, as a person signs in. */
export async function subscribed(
  t: TestContext,
  folder: string,
  provider: 'claude' | 'openai' = 'claude',
  /** What the Hub's configuration also carries, besides the Sankhya double (the scorecard adds Mercado Livre). */
  change: (config: Config) => Config = (same) => same,
) {
  const sankhya = await salesSankhya(t)
  const hub = await hubWithLog(t, (config) => {
    const named = change(config)
    return {
      ...named,
      connectorOrigins: new Map([...(named.connectorOrigins ?? []), ['sankhya', sankhya.origin]]),
    }
  })
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const company = `/api/companies/${companyId}`
  const kind = provider === 'claude' ? 'claude_subscription' : 'openai_codex'
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, $2)`,
    [companyId, kind],
  )
  const file = LOGIN_FILES[provider]
  const kept = keptLogin(file)
  if (file !== undefined) keeping(t, file, kept, VENDORS[provider])
  if (provider === 'openai') {
    await polled(hub, ana, company, folder, kept !== undefined)
  } else {
    const body = { owner: 'company', kind, label: 'Assinatura' }
    const opened = await post(hub, ana, `${company}/model-account-sign-ins`, body)
    assert.equal(opened.statusCode, 201, opened.body)
    const { url, signInId } = Object(opened.json())
    const code =
      kept === undefined
        ? await linkCode(folder, url)
        : `saved#${new URL(url).searchParams.get('state')}`
    const linked = await post(hub, ana, `${company}/model-account-sign-ins/${signInId}`, { code })
    assert.equal(linked.statusCode, 201, linked.body)
  }
  const model = CHOICES[provider]
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
    ...{ matriz: ids[0], filial: ids[1], projectId, companyId, sankhya: sankhya.fake },
  }
}

export type Subscribed = Awaited<ReturnType<typeof subscribed>>
