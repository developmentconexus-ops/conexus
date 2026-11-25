import assert from 'node:assert/strict'
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import type { CheckReport } from '@conexus/app/check'
import { STEP_NAMES } from '@conexus/app/check'
import { asked, conversing, endOf } from '../../harness/routes/test-conversation.ts'
import { stepped, tool } from '../../harness/routes/test-questions.ts'
import { sameRequests } from '../../harness/spec/test-request.ts'
import type { Block } from '../../platform/test-anthropic-stream.ts'

const WRITE = tool('mastra_workspace_write_file', { path: 'a.ts', content: 'x\n' })
// A write and not a command: a command's result says how long it ran, which changes from run to run.
const FIX = tool('mastra_workspace_write_file', { path: 'a.ts', content: 'y\n' })
const DONE: Block = { type: 'text', text: 'Pronto.' }

/** `tipos` refuses a handler's answer; the steps after it are skipped. */
const REFUSED: CheckReport = {
  ok: false,
  steps: STEP_NAMES.map((name, at) => ({
    name,
    state: at < 2 ? 'passed' : at === 2 ? 'failed' : 'skipped',
    problems:
      at === 2
        ? [{ file: 'server/handlers.ts', line: 13, column: 5, code: 'TS2322', message: 'Erro.' }]
        : [],
  })),
}
const PASSED: CheckReport = {
  ok: true,
  steps: STEP_NAMES.map((name) => ({ name, state: 'passed', problems: [] })),
}

/** The machine's check program: it prints `REFUSED` on its first `refusals` runs, then `PASSED`. */
function checkRefusing(folder: string, refusals: number) {
  mkdirSync(folder, { recursive: true })
  writeFileSync(join(folder, 'refused.json'), JSON.stringify(REFUSED))
  writeFileSync(join(folder, 'passed.json'), JSON.stringify(PASSED))
  const runs = join(folder, 'runs')
  const program = [
    '#!/bin/sh',
    `runs=$(wc -c < '${runs}' 2>/dev/null || echo 0)`,
    `printf . >> '${runs}'`,
    `if [ "$runs" -lt ${refusals} ]; then cat '${folder}/refused.json'; else cat '${folder}/passed.json'; fi`,
  ]
  writeFileSync(join(folder, 'check'), program.join('\n'))
  chmodSync(join(folder, 'check'), 0o755)
}

function snapshot(name: string): string {
  return fileURLToPath(new URL(`./requests/${name}.snapshot`, import.meta.url))
}

/** A Builder turn in a new conversation of the Projeto on `steps`, its check refusing `refusals` times; the bodies of the turn's calls. */
async function turnOn(t: Parameters<typeof conversing>[0], steps: Block[][], refusals: number) {
  const { hub, ana, conversations, anthropic } = await conversing(
    t,
    stepped(steps.map((blocks) => () => blocks)),
  )
  checkRefusing(hub.builder.folder, refusals)
  const { events } = await asked(t, { hub, person: ana, conversations }, 'Crie o app de encomendas')
  assert.equal(endOf(events), 'complete')
  return anthropic.sent.filter((each) => each.stream).map((each) => each.body)
}

test('o primeiro turno num Projeto: uma escrita e a resposta depois dela', async (t) => {
  const bodies = await turnOn(t, [[WRITE], [DONE]], 0)
  assert.equal(bodies.length, 2)
  sameRequests(t, bodies, snapshot('primeiro-turno'))
})

test('o juiz reprova uma vez: o modelo recebe o motivo, conserta e termina', async (t) => {
  const bodies = await turnOn(t, [[WRITE], [DONE], [FIX], [DONE]], 1)
  assert.equal(bodies.length, 4)
  sameRequests(t, bodies, snapshot('juiz-reprova'))
})
