import { execFileSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer } from 'node:https'
import { homedir, tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import type { TestContext } from 'node:test'
import { AppSessionToken } from '@conexus/hub-api'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { createMachines } from './public.ts'
import {
  COMPANY,
  CONVERSATION,
  INSTALLATION,
  killStaleOf,
  localKit,
  PROJECT,
  TEMPLATE,
  world,
} from './test-machine.ts'

const ROOT = resolve(import.meta.dirname, '../../../../..')
export const TOKEN = AppSessionToken.parse(`Tok3n${'x'.repeat(38)}`)
export const COOKIE = '__Host-conexus-app'
export const MARK = 'marca-da-pagina-9f3c'

const Browsers = z.object({
  browsers: z.array(z.object({ name: z.string(), revision: z.string() })),
})

function headlessShell(): string {
  const { browsers } = Browsers.parse(
    JSON.parse(readFileSync(join(ROOT, 'node_modules/playwright-core/browsers.json'), 'utf8')),
  )
  const revision = browsers.find(({ name }) => name === 'chromium-headless-shell')?.revision
  const folder = join(homedir(), '.cache/ms-playwright', `chromium_headless_shell-${revision}`)
  return join(folder, 'chrome-headless-shell-linux64/chrome-headless-shell')
}

export function realBrowser(t: TestContext): string {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-browser-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  const program = join(folder, 'agent-browser')
  writeFileSync(
    program,
    [
      '#!/bin/sh',
      `export HOME='${homedir()}' AGENT_BROWSER_SESSION='${basename(folder)}'`,
      `export AGENT_BROWSER_IGNORE_HTTPS_ERRORS=1 AGENT_BROWSER_EXECUTABLE_PATH='${headlessShell()}'`,
      `exec '${join(ROOT, 'node_modules/.bin/agent-browser')}' "$@"`,
      '',
    ].join('\n'),
  )
  chmodSync(program, 0o755)
  return program
}

type Seen = { method: string; url: string; cookie: string | undefined }

export async function appServer(
  t: TestContext,
  answer: (request: IncomingMessage, response: ServerResponse) => void,
) {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-tls-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  const [key, cert] = [join(folder, 'key.pem'), join(folder, 'cert.pem')]
  execFileSync(
    'openssl',
    [
      ...['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:prime256v1', '-nodes'],
      ...['-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=conexus-test'],
      ...['-addext', 'subjectAltName=DNS:localhost'],
    ],
    { stdio: 'ignore' },
  )
  const seen: Seen[] = []
  const server = createServer(
    { key: readFileSync(key), cert: readFileSync(cert) },
    (request, response) => {
      seen.push({
        method: request.method ?? '',
        url: request.url ?? '',
        cookie: request.headers.cookie,
      })
      answer(request, response)
    },
  )
  await new Promise<void>((up) => server.listen(0, '127.0.0.1', up))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  if (address === null || typeof address === 'string') throw new Error('the server has no port')
  return { at: { url: new URL(`https://localhost:${address.port}`), session: TOKEN }, seen }
}

function html(script: string): string {
  return `<!doctype html><title>app</title><h1>Encomendas</h1><script>${script}</script>`
}

export function app(script: string) {
  return (request: IncomingMessage, response: ServerResponse) => {
    const url = request.url ?? ''
    if (url === '/api/corta') return request.socket.destroy()
    const status = /^\/api\/(\d{3})$/.exec(url)?.[1]
    if (url === '/api/listarEncomendas') status500(response)
    else if (status !== undefined) response.writeHead(Number(status)).end('x')
    else response.writeHead(200, { 'content-type': 'text/html' }).end(html(script))
  }
}

function status500(response: ServerResponse) {
  response.writeHead(500).end('x')
}

export async function conferring(t: TestContext, program: string) {
  const lines: string[] = []
  const log: FailureLog = {
    info: (fields, message) => lines.push(JSON.stringify([message, fields])),
    error: (fields, message) => lines.push(JSON.stringify([message, fields])),
  }
  const machine = await world(t)
  const machines = createMachines({
    kit: localKit(machine.folder, machine.control),
    api: { kill: async () => 0, killStale: killStaleOf(machine.control) },
    seedOf: () => machine.repository.bundleOfMain(),
    mark: { conexus_origin: INSTALLATION },
    ...{ installation: INSTALLATION, template: TEMPLATE, log, startMs: 5_000 },
    ...{ workdir: join(machine.folder, 'app'), tmp: machine.folder, browserProgram: program },
  })
  await machines.workspaceFor({
    ...{ companyId: COMPANY, projectId: PROJECT, conversationId: CONVERSATION },
    onPhase: () => undefined,
  })
  return { ...machine, machines, lines }
}

export type Conferring = Awaited<ReturnType<typeof conferring>>

export function confer({ machines }: Conferring, at: Awaited<ReturnType<typeof appServer>>['at']) {
  return machines.confer({ conversationId: CONVERSATION, at })
}

export const FAILED = { ok: false, error: 'CONFER_PLATFORM_FAILED' }

export function stubBrowser(
  t: TestContext,
  options: Readonly<{ failOn?: string; text?: string; host?: string }> = {},
) {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-stub-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  const program = join(folder, 'agent-browser')
  const [calls, cookies] = [join(folder, 'calls'), join(folder, 'cookies.json')]
  const here = options.host ?? 'localhost:4433'
  writeFileSync(
    program,
    [
      '#!/bin/sh',
      `printf '%s\\n' "$*" >> '${calls}'`,
      `test "$2" != cookies || cp "$5" '${cookies}'`,
      `test "$2" != '${options.failOn ?? ''}' || { echo '${options.text ?? 'sem JSON'}'; exit 1; }`,
      'case "$2" in',
      `  get) echo '{"success":true,"data":{"url":"https://${here}/"}}' ;;`,
      `  console) echo '{"success":true,"data":{"messages":[]}}' ;;`,
      `  errors) echo '{"success":true,"data":{"errors":[]}}' ;;`,
      `  network) echo '{"success":true,"data":{"requests":[]}}' ;;`,
      `  *) echo '${options.text ?? '{"success":true,"data":{}}'}' ;;`,
      'esac',
      '',
    ].join('\n'),
  )
  chmodSync(program, 0o755)
  return {
    program,
    calls: () => readFileSync(calls, 'utf8').trim().split('\n'),
    cookies: () => readFileSync(cookies, 'utf8'),
  }
}
