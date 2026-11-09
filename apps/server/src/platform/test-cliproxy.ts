// A double of CLIProxyAPI v8.0.33's management API for Google's sign-in (T15), run as the program:
// it reads the config it is given, refuses to listen off 127.0.0.1, and writes one login file once
// the callback brings its state. In the folder after `--control`, the file `mode` says `refuse` to
// fail the login, and `runs` gets its pid and folder, a line per run. Its model list, `/v1/models`,
// answers the ids the file `models` holds, comma apart, or the ids recorded from the founder's proxy,
// and none for the milliseconds the file `loading` holds after it starts, or while the file `hold`
// is there, as v8.0.33 does while it fetches the login's models from Google. Its model route, `/v1`'s Chat
// Completions, answers with the recording the file `recording` names (testing T24; one name a line, the call's own in order, the last again after them), and adds the
// model each call asks for to the file `asked`, a line per call, and the body of each call to the file `bodies`, a
// line per call. The call of Mastra's memory observer (its system starts "You are the memory consciousness") is
// answered by the file `observer`: `fail` with a server error, `ok` with valid observations in the recording's own
// stream, its text replaced; without the file it is any call.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { z } from 'zod'
import { endedOf, RECORDINGS, recordedBody } from './test-recordings.ts'

const configPath = process.argv[process.argv.indexOf('--config') + 1] ?? ''
const config = readFileSync(configPath, 'utf8')
function field(name: string) {
  return new RegExp(`${name}: "?([^"\\n]+)"?`).exec(config)?.[1] ?? ''
}
const [host, port, key, authDir] = [
  field('host'),
  field('port'),
  field('secret-key'),
  field('auth-dir'),
]
if (host !== '127.0.0.1' || !process.argv.includes('--local-model')) process.exit(3)
const control = process.argv[process.argv.indexOf('--control') + 1] ?? ''
appendFileSync(join(control, 'runs'), `${process.pid} ${process.cwd()}\n`)
const modeFile = join(control, 'mode')
const mode = existsSync(modeFile) ? readFileSync(modeFile, 'utf8').trim() : 'ok'
const LISTED = z
  .object({ data: z.array(z.object({ id: z.string() })) })
  .parse(JSON.parse(readFileSync(join(RECORDINGS, 'google-cliproxy-models.list.json'), 'utf8')))
  .data.map((one) => one.id)
const loadingFile = join(control, 'loading')
const loadedAt =
  Date.now() + (existsSync(loadingFile) ? Number(readFileSync(loadingFile, 'utf8')) : 0)
const state = `estado-${process.pid}`
let status = 'wait'

function body(request: import('node:http').IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString() || '{}')))
  })
}

const OBSERVATIONS = [
  '<observations>',
  '* 🔴 (10:00) Ana quer um app de encomendas da padaria.',
  '</observations>',
].join('\n')

const Asked = z.object({
  messages: z.array(z.object({ role: z.string(), content: z.unknown() })).default([]),
})

/** Whether the call is Mastra's observer: its system message opens with the observer's own words. */
function isObserver(asked: Record<string, unknown>): boolean {
  const system = Asked.parse(asked).messages.find((message) => message.role === 'system')
  return (
    typeof system?.content === 'string' &&
    system.content.startsWith('You are the memory consciousness')
  )
}

/** The recorded stream with its answer's text replaced by valid observations, every other byte as recorded. */
function observed(recording: Buffer): Buffer {
  let first = true
  const lines = recording
    .toString('utf8')
    .split('\n')
    .map((line) => {
      if (!line.startsWith('data: {')) return line
      const chunk: { choices: { delta: { content: string | null } }[] } = JSON.parse(line.slice(6))
      const delta = chunk.choices[0]?.delta
      if (typeof delta?.content !== 'string' || delta.content === '') return line
      delta.content = first ? OBSERVATIONS : ''
      first = false
      return `data: ${JSON.stringify(chunk)}`
    })
  return Buffer.from(lines.join('\n'))
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1')
  function reply(code: number, value: unknown) {
    response.writeHead(code, { 'content-type': 'application/json' }).end(JSON.stringify(value))
  }
  if (request.headers.authorization !== `Bearer ${key}`) return reply(401, { error: 'key' })
  if (url.pathname === '/v0/management/antigravity-auth-url') {
    return reply(200, { url: `https://accounts.google.com/o/oauth2/v2/auth?state=${state}`, state })
  }
  if (url.pathname === '/v0/management/oauth-callback' && request.method === 'POST') {
    const sent = z
      .object({
        redirect_url: z.string().default('http://x'),
        provider: z.string(),
        state: z.string(),
      })
      .safeParse(await body(request))
    const given = sent.success
      ? new URL(sent.data.redirect_url).searchParams.get('state')
      : undefined
    if (
      !sent.success ||
      sent.data.provider !== 'antigravity' ||
      sent.data.state !== state ||
      given !== state
    )
      return reply(400, { error: 'state' })
    status = mode === 'refuse' ? 'error' : 'ok'
    if (status === 'ok') {
      mkdirSync(authDir, { recursive: true })
      const login = {
        type: 'antigravity',
        access_token: 'ya29.planted-google-token',
        refresh_token: '1//planted-refresh',
      }
      writeFileSync(join(authDir, 'antigravity-pessoa.json'), JSON.stringify(login))
    }
    return reply(200, { status: 'ok' })
  }
  if (url.pathname === '/v0/management/get-auth-status') {
    return reply(200, url.searchParams.has('state') ? { status } : { status: 'ok' })
  }
  if (url.pathname === '/v1/models' && request.method === 'GET') {
    const file = join(control, 'models')
    const ids = existsSync(file) ? readFileSync(file, 'utf8').trim().split(',') : LISTED
    if (Date.now() < loadedAt || existsSync(join(control, 'hold'))) {
      return reply(200, { object: 'list', data: [] })
    }
    return reply(200, { object: 'list', data: ids.map((id) => ({ id, object: 'model' })) })
  }
  if (url.pathname === '/v1/chat/completions' && request.method === 'POST') {
    const asked = await body(request)
    if ('tools' in asked) writeFileSync(join(control, 'body'), JSON.stringify(asked))
    appendFileSync(join(control, 'asked'), `${asked.model}\n`)
    appendFileSync(join(control, 'bodies'), `${JSON.stringify(asked)}\n`)
    const observing = isObserver(asked)
    const observer = join(control, 'observer')
    if (observing && existsSync(observer) && readFileSync(observer, 'utf8').trim() === 'fail') {
      return reply(500, { error: { message: 'upstream failed', type: 'server_error' } })
    }
    const names = readFileSync(join(control, 'recording'), 'utf8').trim().split('\n')
    const calls = readFileSync(join(control, 'asked'), 'utf8').trim().split('\n').length
    const name = names[Math.min(calls, names.length) - 1] ?? ''
    const recorded =
      observing && existsSync(observer)
        ? observed(recordedBody('google-thinking'))
        : recordedBody(name)
    response.writeHead(200, { 'content-type': 'text/event-stream' })
    // A stream the client cut stays open, as the provider was still sending, until the Hub stops.
    return endedOf(recorded) ? response.end(recorded) : response.write(recorded)
  }
  return reply(404, {})
})
server.listen(Number(port), host)
