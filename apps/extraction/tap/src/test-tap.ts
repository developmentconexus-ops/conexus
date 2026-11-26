import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Connector, Fake } from '@conexus/connectors'
import {
  authorizeUrl,
  codeRequest,
  connectorOf,
  hubspotFake,
  parseJson,
  readGrant,
  sankhyaFake,
  toRequest,
} from '@conexus/connectors'
import { z } from 'zod'
import type { TapState } from './messages.ts'
import type { TapDeps } from './tap.ts'
import { runTap } from './tap.ts'

export const SANKHYA = connectorOf('sankhya') ?? assert.fail()
export const HUBSPOT = connectorOf('hubspot') ?? assert.fail()

export const NOW = Date.parse('2026-11-24T15:00:00Z')

export type Message = Readonly<{ type: string; stream?: string; [field: string]: unknown }>

async function hubspotSecret(
  fake: ReturnType<typeof hubspotFake>,
): Promise<Record<string, string>> {
  const { auth } = HUBSPOT
  if (auth.kind !== 'oauth2_code') return assert.fail()
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  const redirectUri = fake.redirectUri
  const page = await fake.handle(
    new Request(
      authorizeUrl(
        auth,
        { clientId: fake.app.clientId, redirectUri, state: 's', challenge },
        HUBSPOT.origin,
      ),
      { redirect: 'manual' },
    ),
  )
  const code = new URL(page.headers.get('location') ?? '').searchParams.get('code') ?? assert.fail()
  const sent = await fake.handle(
    toRequest(HUBSPOT, codeRequest(auth, fake.app, { code, verifier, redirectUri }), null),
  )
  const grant = readGrant(auth, {
    status: sent.status,
    body: parseJson(await sent.text(), 'EXACT'),
  })
  return grant.kind === 'OK' ? { access: grant.accessToken } : assert.fail()
}

export type Double = Readonly<{ connector: Connector; fake: Fake; secret: Record<string, string> }>

export function sankhyaDouble(fake = sankhyaFake()): Double {
  return { connector: SANKHYA, fake, secret: { ...fake.credential } }
}

export async function hubspotDouble(fake = hubspotFake()): Promise<Double> {
  return { connector: HUBSPOT, fake, secret: await hubspotSecret(fake) }
}

export function selected(source: string, stream: string) {
  return {
    stream,
    table_name: source,
    metadata: [{ breadcrumb: [], metadata: { selected: true } }],
  }
}

function streamOf(streams: readonly unknown[] | undefined, source: string): string {
  const named = z.array(z.object({ stream: z.string(), table_name: z.string() }).loose())
  return (
    named.parse(streams ?? []).find(({ table_name }) => table_name === source)?.stream ??
    assert.fail(source)
  )
}

export type TapRun = Readonly<{
  code: number
  lines: readonly string[]
  messages: readonly Message[]
  result: unknown
  waits: readonly number[]
  logs: readonly Readonly<Record<string, unknown>>[]
}>

export async function tap(
  double: Double,
  a: Readonly<{
    args?: readonly string[]
    streams?: readonly unknown[]
    state?: TapState
    startDate?: string | null
    whole?: readonly string[]
    configTables?: readonly Readonly<{ source: string; name: string; whole: boolean }>[]
    fetch?: (request: Request) => Promise<Response>
    now?: number
    timeoutMs?: number
  }> = {},
): Promise<TapRun> {
  const dir = await mkdtemp(join(tmpdir(), 'tap-'))
  async function file(name: string, value: unknown) {
    await writeFile(join(dir, name), JSON.stringify(value))
    return join(dir, name)
  }
  const config = await file('config.json', {
    connector: double.connector.id,
    account: null,
    secret_path: await file('secret.json', double.secret),
    result_path: join(dir, 'result.json'),
    start_date: a.startDate ?? null,
    tables:
      a.configTables ??
      (a.whole ?? []).map((source) => ({ source, name: streamOf(a.streams, source), whole: true })),
  })
  const args = a.args ?? [
    '--config',
    config,
    '--catalog',
    await file('catalog.json', { streams: a.streams ?? [] }),
    ...(a.state === undefined ? [] : ['--state', await file('state.json', a.state)]),
  ]
  const lines: string[] = []
  const waits: number[] = []
  const logs: Record<string, unknown>[] = []
  const handle = a.fetch ?? ((request: Request) => double.fake.handle(request))
  const deps: TapDeps = {
    fetch: async (input, init) => handle(new Request(input, init)),
    timeoutMs: a.timeoutMs ?? 60_000,
    log: (line) => {
      logs.push(z.record(z.string(), z.unknown()).parse(JSON.parse(line)))
    },
    now: () => a.now ?? NOW,
    sleep: async (ms) => {
      waits.push(ms)
    },
    random: () => 0.5,
    write: async (line) => {
      lines.push(line)
    },
  }
  const code = await runTap(
    args.map((arg) => (arg === '<config>' ? config : arg)),
    deps,
  )
  const result = await readFile(join(dir, 'result.json'), 'utf8').then(
    (text) => z.unknown().parse(JSON.parse(text)),
    () => null,
  )
  const messages = lines.flatMap((line) => {
    const message = z.looseObject({ type: z.string() }).safeParse(JSON.parse(line))
    return message.success ? [message.data] : []
  })
  return { code, lines, messages, result, waits, logs }
}

export function recordsOf(run: TapRun, stream: string): readonly Record<string, unknown>[] {
  return run.messages
    .filter((message) => message.type === 'RECORD' && message.stream === stream)
    .map((message) => z.record(z.string(), z.unknown()).parse(message.record))
}

export function lastState(run: TapRun): TapState {
  const states = run.messages.filter((message) => message.type === 'STATE')
  return z.object({ value: z.custom<TapState>() }).parse(states.at(-1)).value
}

export const WINDOW = [selected('TGFEFDVMRSTDIA', 'efd')]

export function monthsOf(run: TapRun): readonly string[] {
  return [...new Set(recordsOf(run, 'efd').map((row) => String(row.dtref).slice(0, 7)))]
}

export function activated(run: TapRun, stream: string): readonly Message[] {
  return run.messages.filter(({ type, stream: of }) => type === 'ACTIVATE_VERSION' && of === stream)
}
