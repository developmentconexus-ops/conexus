import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { SHUTDOWN_DEADLINE_MS } from './lifecycle.ts'

/** A wait longer than the close's own deadline, so only the wait's share of the deadline covers it. */
const SETTLE_TAKES_MS = SHUTDOWN_DEADLINE_MS + 1_000

/**
 * A process with the Hub's shutdown on its signals and steps that log their names; `settle` takes
 * `SETTLE_TAKES_MS` whatever its bound says, and `crash` throws once it listens.
 */
function program(crash: boolean): string {
  return `
import Fastify from ${JSON.stringify(import.meta.resolve('fastify'))}
import { shutDownOnSignal } from ${JSON.stringify(import.meta.resolve('./lifecycle.ts'))}
const app = Fastify({ logger: { level: 'info' } })
const edge = Fastify()
await app.listen({ host: '127.0.0.1', port: 0 })
await edge.listen({ host: '127.0.0.1', port: 0 })
shutDownOnSignal(app, edge, {
  settleMs: ${SETTLE_TAKES_MS + 1_000},
  settle: () => new Promise((done) => setTimeout(() => done(app.log.info('SETTLED')), ${SETTLE_TAKES_MS})),
  drain: async () => app.log.info('DRAINED'),
  release: async () => app.log.info('RELEASED'),
})
app.log.info('READY')
${crash ? "setImmediate(() => { throw new Error('boom') })" : ''}
`
}

/** Runs the program until it exits, sending SIGTERM once it is ready unless it crashes. */
async function run(t: TestContext, crash: boolean) {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-lifecycle-'))
  t.after(() => rmSync(folder, { recursive: true, force: true }))
  const file = join(folder, 'program.mjs')
  writeFileSync(file, program(crash))
  const child = spawn(process.execPath, [file], { stdio: ['ignore', 'pipe', 'inherit'] })
  const lines: string[] = []
  let buffered = ''
  child.stdout.on('data', (chunk: Buffer) => {
    buffered += chunk.toString('utf8')
    const whole = buffered.split('\n')
    buffered = whole.pop() ?? ''
    for (const line of whole) {
      // Fastify's own listening lines are prose; the codes are the steps'.
      const { msg } = JSON.parse(line)
      if (/^[A-Z_]+$/.test(msg)) lines.push(msg)
      if (msg === 'READY' && !crash) child.kill('SIGTERM')
    }
  })
  const [code] = await once(child, 'exit')
  return { code, lines }
}

test('o aviso de parar espera as respostas antes de fechar, e o prazo cobre uma espera maior que o fecho (E1)', {
  timeout: 60_000,
}, async (t) => {
  const { code, lines } = await run(t, false)
  assert.deepEqual(lines, ['READY', 'SHUTTING_DOWN', 'SETTLED', 'DRAINED', 'RELEASED'])
  assert.equal(code, 0)
})

test('um erro inesperado fecha sem esperar: nada de espera nem de "sendo atualizado"', {
  timeout: 60_000,
}, async (t) => {
  const { code, lines } = await run(t, true)
  assert.deepEqual(lines, ['READY', 'INTERNAL_UNEXPECTED', 'SHUTTING_DOWN', 'DRAINED', 'RELEASED'])
  assert.equal(code, 1)
})
