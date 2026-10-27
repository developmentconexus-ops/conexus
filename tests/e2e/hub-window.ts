import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { BrowserContext, Page } from 'playwright-core'
import { chromium } from 'playwright-core'
import { TEST_ORIGIN } from '../../apps/server/src/platform/test-database.ts'
import { recordTranscript } from './conversation-journey.ts'
import { watchConsole } from './live-hub.ts'

const SUBSCRIBE_MS = 1500

/**
 * A browser of its own that reaches the Hub by its public name through a streaming front: a
 * self-signed HTTPS server that pipes every request to the Hub as the tunnel does, with the
 * client address in Cloudflare's header. The test ends each window through `closers` before its
 * Hub stops listening: in its body, or in a `t.after` given before `liveHub`'s, as `t.after` runs
 * its hooks in the order they were given. `reachHub`'s route answers only once a body has ended,
 * so it cannot carry the conversation's event stream, which stays open for the whole screen.
 * `cutConnections` ends every connection open through the front, as a network that drops does.
 */
export async function hubWindow(
  closers: (() => Promise<void>)[],
  hubPort: number,
  ip: string,
  problems: string[],
): Promise<Page & { cutConnections(): void }> {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-front-'))
  const [key, cert] = [join(folder, 'key.pem'), join(folder, 'cert.pem')]
  const host = new URL(TEST_ORIGIN).hostname
  execFileSync(
    'openssl',
    ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '1'].concat([
      '-subj',
      `/CN=${host}`,
      '-addext',
      `subjectAltName=DNS:${host}`,
      '-keyout',
      key,
      '-out',
      cert,
    ]),
    { stdio: 'ignore' },
  )
  const front = https.createServer(
    { key: readFileSync(key), cert: readFileSync(cert) },
    (request, response) => {
      const headers = { ...request.headers, 'cf-connecting-ip': ip }
      const upstream = http.request(
        { host: '127.0.0.1', port: hubPort, method: request.method, path: request.url, headers },
        (answer) => {
          response.writeHead(answer.statusCode ?? 502, answer.headers)
          answer.pipe(response)
        },
      )
      upstream.on('error', () => response.destroy())
      response.on('close', () => upstream.destroy())
      request.pipe(upstream)
    },
  )
  await new Promise<void>((resolve) => front.listen(0, '127.0.0.1', resolve))
  const address = front.address()
  assert.ok(address !== null && typeof address === 'object')
  const browser = await chromium.launch({
    args: [`--host-resolver-rules=MAP ${host} 127.0.0.1:${address.port}`],
  })
  closers.push(async () => {
    await browser.close()
    front.closeAllConnections()
    front.close()
    rmSync(folder, { recursive: true, force: true })
  })
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  const page = await anotherPage(context, problems)
  return Object.assign(page, { cutConnections: () => front.closeAllConnections() })
}

/** A page of the same person, in the same browser: it shares the session and the address. */
export async function anotherPage(context: BrowserContext, problems: string[]): Promise<Page> {
  const page = await context.newPage()
  watchConsole(page, problems)
  await recordTranscript(page)
  return page
}

/**
 * Opens a conversation and returns once Mastra's session stream is open and has had time to
 * subscribe: the stream's headers come before the session's subscription.
 */
export async function openConversation(page: Page, open: string | (() => Promise<void>)) {
  const opened = page.waitForResponse((response) => response.url().endsWith('/stream'))
  if (typeof open === 'string') await page.goto(open)
  else await open()
  await opened
  await page.waitForTimeout(SUBSCRIBE_MS)
}
