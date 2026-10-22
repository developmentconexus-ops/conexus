import { existsSync, readFileSync, statSync } from 'node:fs'
import type { Server } from 'node:http'
import { createServer } from 'node:http'
import { join, normalize } from 'node:path'
import { APP_CONTENT_SECURITY_POLICY, mediaTypeOf } from '@conexus/app-contract'
import type { Page, Browser as PlaywrightBrowser } from 'playwright-core'
import { chromium, errors } from 'playwright-core'
import { z } from 'zod'
import type { Problem } from './report.ts'
import { CHECK_LIMITS } from './report.ts'
import type { Browser, CheckContext, Outcome } from './step.ts'
import { PASSED, problem, workOf } from './step.ts'

// The load does not wait for a module's fetches: #root is given 10 s to get a child, then 300 ms
// for what the first render sets off (Conexus OS `e0353c36` `steps/boot.ts:16-17`).
const RENDER_CEILING_MS = 10_000
const RENDER_SETTLE_MS = 300

// The page reports each violation of its policy to the check, before any script of the app runs.
const REPORT_VIOLATIONS = `document.addEventListener('securitypolicyviolation', (event) =>
  conexusViolation({ directive: event.violatedDirective, blocked: event.blockedURI,
    file: event.sourceFile, line: event.lineNumber, column: event.columnNumber }))`

const Violation = z.object({
  directive: z.string(),
  blocked: z.string(),
  file: z.string(),
  line: z.int(),
  column: z.int(),
})

/** The built screens on a local origin, under the dispatcher's policy; an unknown path is the page, as on the air. */
function serve(folder: string, policy: string): Server {
  return createServer((request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url ?? '/', 'http://app').pathname))
    const asked = join(folder, path)
    const file = asked.startsWith(folder) && existsSync(asked) && statSync(asked).isFile()
    const served = file ? asked : join(folder, 'index.html')
    response.writeHead(200, {
      'Content-Type': mediaTypeOf(served),
      'Content-Security-Policy': policy,
      'X-Content-Type-Options': 'nosniff',
    })
    response.end(readFileSync(served))
  })
}

/** What the page does while it loads: each policy violation, each console error and uncaught error. */
async function watch(page: Page, origin: string) {
  const violations: Problem[] = []
  const errors: Problem[] = []
  await page.exposeFunction('conexusViolation', (value: unknown) => {
    const { directive, blocked, file, line, column } = Violation.parse(value)
    violations.push(
      problem({
        code: 'CSP_VIOLATION',
        message: `The page's policy refused ${blocked || 'inline content'} under ${directive}.`,
        file: file.startsWith(`${origin}/`) ? file.slice(origin.length + 1) : null,
        line: line > 0 ? line : null,
        column: column > 0 ? column : null,
      }),
    )
  })
  await page.addInitScript({ content: REPORT_VIOLATIONS })
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    errors.push(problem({ code: 'CONSOLE_ERROR', message: message.text() }))
  })
  page.on('pageerror', (error) => {
    errors.push(problem({ code: 'UNCAUGHT_ERROR', message: error.message }))
  })
  return { violations, errors }
}

/**
 * Whether `#root` got a child by the ceiling and still has one once the first render settled, by
 * Playwright's own locator wait: its engine runs in its own injected world, which the page's policy
 * does not see.
 */
async function rootDrawn(page: Page, ceilingMs: number): Promise<boolean> {
  const children = page.locator('#root > *')
  try {
    await children.first().waitFor({ timeout: ceilingMs })
  } catch (error) {
    if (error instanceof errors.TimeoutError) return false
    throw error
  }
  await page.waitForTimeout(RENDER_SETTLE_MS)
  return (await children.count()) > 0
}

/** The real browser: Chromium's headless shell through playwright-core, within the step's time. */
export async function browseInChromium({
  folder,
  policy,
  timeoutMs,
}: Parameters<Browser>[0]): ReturnType<Browser> {
  const deadline = Date.now() + timeoutMs
  function left() {
    return Math.max(1, deadline - Date.now())
  }
  const server = serve(folder, policy)
  await new Promise<void>((listening) => server.listen(0, '127.0.0.1', listening))
  const address = server.address()
  const origin = `http://127.0.0.1:${typeof address === 'object' ? address?.port : ''}`
  let browser: PlaywrightBrowser
  try {
    browser = await chromium.launch({ timeout: left() })
  } catch (error) {
    server.close()
    return { unavailable: `Chromium did not start: ${String(error)}` }
  }
  try {
    const page = await browser.newPage()
    const { violations, errors } = await watch(page, origin)
    await page.goto(`${origin}/`, { waitUntil: 'load', timeout: left() })
    const drawn = await rootDrawn(page, Math.min(RENDER_CEILING_MS, left()))
    return { violations, rootEmpty: !drawn, errors }
  } finally {
    await browser.close()
    server.close()
  }
}

/** The built screens in a browser: a policy violation or an empty `#root` fails; a console error only informs (decision 0055). */
export async function navegador(ctx: CheckContext): Promise<Outcome> {
  const seen = await ctx.browse({
    folder: workOf(ctx, 'dist'),
    policy: APP_CONTENT_SECURITY_POLICY,
    timeoutMs: CHECK_LIMITS.stepMs,
  })
  if ('unavailable' in seen) return { state: 'platform', reason: seen.unavailable }
  const empty = seen.rootEmpty
    ? [
        problem({
          code: 'ROOT_EMPTY',
          message: 'The page loaded but #root has no children: nothing was drawn.',
        }),
      ]
    : []
  const failures = [...seen.violations, ...empty]
  if (failures.length > 0) return { state: 'failed', problems: [...failures, ...seen.errors] }
  return seen.errors.length > 0 ? { state: 'informed', problems: seen.errors } : PASSED
}
