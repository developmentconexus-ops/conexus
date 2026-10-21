import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { Manifest, versionFiles } from '@conexus/app-contract'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { LEAK, RECORDINGS } from '../../platform/test-recordings.ts'
import { asked, conversing, title } from './test-conversation.ts'

// Defect (v0.13.2): on the founder's live script the Builder on Gemini 3.8 Flash High wrote no
// file in 13 minutes, because the skill named `serveApp` without its origin and the instructions
// asked for checks the machine cannot run. The scripted-model gate (builder.eval.test.ts) never
// read the skill. This gate plays a real model's recorded turn from the empty folder: the skill it
// reads, the files it writes. Recorded with `CONEXUS_RECORD_BUILDER=1` and
// `CONEXUS_RECORD_CLIPROXY_KEY` (the local CLIProxy's key, read from the environment only), once per
// change of the skill or the instructions' words; the model is `gemini-3.8-flash-high`.
const STEPS = 'anthropic-builder-writes'
const PROXY = 'http://127.0.0.1:8317/v1/messages'
const MESSAGES = 'https://api.anthropic.com/v1/messages'
const REAL_MODEL = 'gemini-3.8-flash-high'
const ASK =
  'Crie um app de encomendas com cliente, telefone, produto e data de entrega para a Padaria Sol'
const IMPORT = "import { serveApp } from '@conexus/app-contract'"
const COMMAND = 'mastra_workspace_execute_command'
/** What a recording run refuses to let the machine of this computer run: a search, an install, a write outside. */
const UNSAFE = /find |grep |rm |curl|wget|npm|sudo|git |\/etc|\/proc|ps aux|env\b|docker/

const recording = process.env.CONEXUS_RECORD_BUILDER === '1'

function stepFile(step: number, extension: 'sse' | 'json') {
  return join(RECORDINGS, `${STEPS}-${step}.${extension}`)
}

function recordedSteps() {
  return readdirSync(RECORDINGS).filter(
    (file) => file.startsWith(`${STEPS}-`) && file.endsWith('.sse'),
  )
}

/**
 * Sends each Builder call to the local CLIProxy under the real model's name and saves the body it
 * answers: only that body, no header (S40). The run is the live one, so a command that is not a
 * look at the manifest stops it before the machine of this computer runs it.
 */
function recorder(t: TestContext) {
  const key = process.env.CONEXUS_RECORD_CLIPROXY_KEY
  assert.ok(key, 'CONEXUS_RECORD_CLIPROXY_KEY is not set')
  const before = globalThis.fetch
  let step = 0
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    const body = typeof init?.body === 'string' ? init.body : ''
    if (!url.startsWith(MESSAGES) || !body.includes('Builder of Conexus'))
      return before(input, init)
    const headers = new Headers(init?.headers)
    headers.delete('authorization')
    headers.set('x-api-key', key)
    const model = { ...JSON.parse(body), model: REAL_MODEL }
    const response = await before(PROXY, { ...init, headers, body: JSON.stringify(model) })
    assert.equal(response.status, 200, `the proxy refused the call with ${response.status}`)
    const text = await response.text()
    assert.equal(LEAK.test(text) || text.includes(key), false, 'the body carries a credential')
    assert.equal(
      text.includes(COMMAND) && UNSAFE.test(text),
      false,
      'the model asked for a command',
    )
    step += 1
    writeFileSync(stepFile(step, 'sse'), text)
    const described = {
      provider: 'anthropic',
      api: `Messages API through CLIProxyAPI, model ${REAL_MODEL}, streamed`,
      sdk: '@ai-sdk/anthropic',
      recordedAt: new Date().toISOString().slice(0, 10),
    }
    writeFileSync(stepFile(step, 'json'), `${JSON.stringify(described, null, 2)}\n`)
    return new Response(text, { status: 200, headers: { 'content-type': 'text/event-stream' } })
  }
  t.after(() => {
    globalThis.fetch = before
  })
}

/** The Builder's calls in order, each answered by the step the real model gave. */
function replaying(builderCalls: Sent[]) {
  return (call: Sent): Reply => {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    if (!call.system.includes('Builder of Conexus')) return { kind: 'text', text: 'Observação' }
    builderCalls.push(call)
    return { kind: 'recorded', name: `${STEPS}-${builderCalls.length}` }
  }
}

test('o portão do Builder com modelo real gravado: da pasta vazia, lê a skill e escreve manifest.json, a entrada e os assets', async (t) => {
  const builderCalls: Sent[] = []
  const { hub, ana, conversations } = await conversing(t, replaying(builderCalls))
  if (recording) recorder(t)
  else assert.ok(recordedSteps().length > 0, 'no recording: record with CONEXUS_RECORD_BUILDER=1')
  const folder = join(hub.builder.folder, 'app')
  const before = existsSync(folder) ? readdirSync(folder).filter((name) => name !== '.git') : []
  assert.deepEqual(before, [])
  const { events } = await asked(t, { hub, person: ana, conversations }, ASK)
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })

  // What the model was given: the skill it read says where serveApp comes from and what the
  // machine cannot do, and the instructions say the same (the words the real model acted on).
  const system = builderCalls[0]?.system ?? ''
  assert.match(system, /never search for them/)
  const read = builderCalls.flatMap((call) => call.texts).join('\n')
  assert.ok(read.includes(IMPORT), 'the skill the model read gives the import of serveApp')
  assert.match(read, /no database/)
  assert.match(read, /do not search/)

  // What it wrote: a manifest the contract accepts, the entry that starts with the import, the assets.
  const manifest = Manifest.parse(JSON.parse(readFileSync(join(folder, 'manifest.json'), 'utf8')))
  assert.ok(readFileSync(join(folder, manifest.entry), 'utf8').trimStart().startsWith(IMPORT))
  for (const path of versionFiles(manifest)) assert.ok(existsSync(join(folder, path)), path)
})
