import { CHECK_LIMITS, firstProblems, WORK_FOLDER } from '@conexus/app/check'
import type { AppSessionToken, ConversationId } from '@conexus/hub-api'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import type { Result } from '../../platform/result.ts'
import type { TimedExec } from './check.ts'
import type { Kit } from './kit.ts'
import { parsedWith } from './pack.ts'
import { quoted } from './scripts.ts'

export const BROWSER_PROGRAM = '/usr/local/bin/agent-browser'

const SHOT = `${WORK_FOLDER}/tela.png`

// The dispatcher's session cookie, `APP_SESSION_COOKIE` in `apps/edge/src/headers.ts`: the edge owns the name.
const COOKIE = '__Host-conexus-app'
const COOKIE_FILE = 'conexus-confer-cookies.json'

const ASK_MS = 20_000
const PAGE_MS = 60_000

type BrowserProblem =
  | { kind: 'PAGE_ERROR'; message: string }
  | { kind: 'REQUEST_FAILED'; method: string; path: string; status: number | null }

export type BrowserReport =
  | { kind: 'CLEAN'; shot: string; console: string[] }
  | { kind: 'DIRTY'; problems: BrowserProblem[]; shot: string; console: string[] }

export type ConferPlatformFailed = 'CONFER_PLATFORM_FAILED'

export type ConferAt = Readonly<{ url: URL; session: AppSessionToken }>

const Done = z.object({ success: z.literal(true) })
function answering<T extends z.ZodType>(data: T) {
  return z.object({ success: z.literal(true), data })
}
const Located = answering(z.object({ url: z.string() }))
const Consoled = answering(
  z.object({ messages: z.array(z.object({ type: z.string(), text: z.string() })) }),
)
const Errored = answering(z.object({ errors: z.array(z.object({ text: z.string() })) }))
const Requested = answering(
  z.object({
    requests: z.array(
      z.object({ method: z.string(), url: z.string(), status: z.number().nullish() }),
    ),
  }),
)

type Outputs = {
  console: z.infer<typeof Consoled>['data']['messages']
  errors: z.infer<typeof Errored>['data']['errors']
  requests: z.infer<typeof Requested>['data']['requests']
}

function clipped(texts: readonly string[]): string[] {
  return firstProblems(
    texts.map((message) => ({ file: null, line: null, column: null, code: 'TEXT', message })),
  ).map(({ message }) => message)
}

function reportOf(outputs: Outputs, host: string): BrowserReport {
  const { errors, requests } = outputs
  const failed = requests.flatMap((request): BrowserProblem[] => {
    const status = request.status ?? null
    if (!URL.canParse(request.url)) return []
    const { hostname, pathname } = new URL(request.url)
    if (hostname !== host || (status !== null && status < 400)) return []
    return [{ kind: 'REQUEST_FAILED', method: request.method, path: pathname, status }]
  })
  const pages = clipped(errors.map(({ text }) => text)).map(
    (message): BrowserProblem => ({ kind: 'PAGE_ERROR', message }),
  )
  const problems = [...pages, ...failed].slice(0, CHECK_LIMITS.problems)
  const written = clipped(
    outputs.console.filter(({ type }) => type === 'error').map(({ text }) => text),
  )
  return problems.length === 0
    ? { kind: 'CLEAN', shot: SHOT, console: written }
    : { kind: 'DIRTY', problems, shot: SHOT, console: written }
}

class Unrunnable extends Error {
  readonly step: string
  readonly exitCode: number | undefined
  readonly detail: string | undefined

  constructor(step: string, options: { exitCode?: number; detail?: string; cause?: unknown } = {}) {
    super(step, { cause: options.cause })
    this.step = step
    this.exitCode = options.exitCode
    this.detail = options.detail
  }

  fields(reason: string): Record<string, string | number> {
    const fields: Record<string, string | number> = {
      reason,
      step: this.step,
      exitCode: this.exitCode ?? -1,
    }
    if (this.cause !== undefined) fields.cause = String(this.cause).slice(0, 500)
    if (this.detail !== undefined) fields.detail = this.detail
    return fields
  }
}

type Conference = Readonly<{
  exec: TimedExec
  files: Readonly<{ write(path: string, text: string): Promise<void> }>
  // `close` never throws: its owner logs a failure, and the machine's next start closes again.
  network: Readonly<{ open(extra: readonly string[]): Promise<void>; close(): Promise<void> }>
  workdir: string
  tmp: string
  program: string
  at: ConferAt
  log: FailureLog
}>

function commandsOf({ exec, program, at }: Pick<Conference, 'exec' | 'program' | 'at'>) {
  function cli(...args: string[]): string {
    return `${quoted(program)} --json ${args.map(quoted).join(' ')}`
  }
  async function ran(step: string, script: string, timeoutMs: number): Promise<string> {
    const done = await attempted(step, () => exec(script, timeoutMs))
    if (done.exitCode !== 0) {
      const detail = done.stderr.replaceAll(at.session, '[token]').trim().slice(-500)
      throw new Unrunnable(step, { exitCode: done.exitCode, detail })
    }
    return done.stdout
  }
  async function read<T>(
    step: string,
    schema: z.ZodType<T>,
    args: string[],
    timeoutMs = ASK_MS,
  ): Promise<T> {
    const reply = parsedWith(schema, await ran(step, cli(...args), timeoutMs))
    if (!reply.success) throw new Unrunnable(step)
    return reply.data
  }
  return { cli, ran, read }
}

async function attempted<T>(step: string, work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (cause) {
    throw new Unrunnable(step, { cause })
  }
}

async function looked(input: Conference, cookieFile: string): Promise<BrowserReport> {
  const { files, network, workdir, at } = input
  const { cli, ran, read } = commandsOf(input)
  const origin = at.url.origin
  await attempted('network', () => network.open([at.url.hostname]))
  await attempted('cookie-file', () =>
    files.write(cookieFile, JSON.stringify([{ name: COOKIE, value: at.session }])),
  )
  await read('launch', Done, ['open'], PAGE_MS)
  await read('cookie', Done, ['cookies', 'set', '--curl', cookieFile, '--url', `${origin}/`])
  await read('open', Done, ['open', `${origin}/`], PAGE_MS)
  await read('wait', Done, ['wait', '--load', 'networkidle'], PAGE_MS)
  const { data: located } = await read('url', Located, ['get', 'url'])
  if (!URL.canParse(located.url) || new URL(located.url).host !== at.url.host)
    throw new Unrunnable('host')
  await ran(
    'shot',
    `mkdir -p ${quoted(`${workdir}/${WORK_FOLDER}`)} && ${cli('screenshot', `${workdir}/${SHOT}`)}`,
    ASK_MS,
  )
  const messages = await read('console', Consoled, ['console'])
  const errors = await read('errors', Errored, ['errors'])
  const requests = await read('requests', Requested, ['network', 'requests'])
  return reportOf(
    {
      console: messages.data.messages,
      errors: errors.data.errors,
      requests: requests.data.requests,
    },
    at.url.hostname,
  )
}

async function conferIn(input: Conference): Promise<Result<BrowserReport, ConferPlatformFailed>> {
  const { network, tmp, log } = input
  const cookieFile = `${tmp}/${COOKIE_FILE}`
  const { cli, ran } = commandsOf(input)
  async function cleaned(step: string, script: string) {
    try {
      await ran(step, script, ASK_MS)
    } catch (error) {
      if (!(error instanceof Unrunnable)) throw error
      log.error(error.fields('CLEANUP'), 'CONFER_CLEANUP_FAILED')
    }
  }
  try {
    const report = await looked(input, cookieFile)
    log.info(
      {
        kind: report.kind,
        problems: report.kind === 'DIRTY' ? report.problems.length : 0,
        console: report.console.length,
      },
      'CONFER_DONE',
    )
    return { ok: true, value: report }
  } catch (error) {
    if (!(error instanceof Unrunnable)) throw error
    log.error(error.fields('STEP'), 'CONFER_PLATFORM_FAILED')
    return { ok: false, error: 'CONFER_PLATFORM_FAILED' }
  } finally {
    await cleaned('close', cli('close'))
    await cleaned('cookie-file', `rm -f ${quoted(cookieFile)}`)
    await network.close()
  }
}

export function conferOn(
  input: Readonly<{
    kit: Kit
    exec: TimedExec
    conversationId: ConversationId
    workdir: string
    tmp: string
    program: string
    at: ConferAt
    log: FailureLog
  }>,
): Promise<Result<BrowserReport, ConferPlatformFailed>> {
  const { kit, conversationId, log } = input
  return conferIn({
    ...input,
    files: { write: (path, text) => kit.transport.write(path, Buffer.from(text)) },
    network: {
      open: (extra) => kit.openNetwork(extra),
      close: () =>
        kit.closeNetwork().catch((cause) => {
          log.error(
            { conversationId, cause: String(cause).slice(0, 500) },
            'MACHINE_NETWORK_CLOSE_FAILED',
          )
        }),
    },
  })
}
