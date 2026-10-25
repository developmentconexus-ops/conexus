import assert from 'node:assert/strict'
import { chmodSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CHECK_LIMITS, STEP_NAMES } from '@conexus/app/check'
import { readSkills } from '@conexus/app/skills'
import { STARTER_DIR } from '@conexus/app/starter'
import type { Reply, Sent } from '../../platform/test-anthropic.ts'
import { APP_FOLDER } from '../machine/public.ts'
import { asked, conversing, endOf, sent, streamOf, title } from './test-conversation.ts'
import { dataOf } from './test-parts.ts'
import type { Filled } from './test-prompt.ts'
import { expectedText, PROMPT_TABLE } from './test-prompt.ts'

const BUILDER = 'You are the Conexus Builder'
const WRITE = 'mastra_workspace_write_file'
const INSTRUCTIONS = '# Instruções da Padaria Sol\n\nChame os clientes de fregueses.\n'
const MEMORY = '# Regras\n- [Entrega no mesmo dia](entrega.md): pedidos até 10h\n'
const MISSING = {
  instructions: '[AGENTS.md is missing; treat it as empty.]',
  memory: '[.conexus/memory/MEMORY.md is missing; treat it as empty.]',
}

function filled(files: Pick<Filled, 'instructions' | 'memory'>): Filled {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(
    new Date(),
  )
  return {
    projectName: 'Encomendas',
    date,
    appFolder: APP_FOLDER,
    checks: CHECK_LIMITS.checks,
    ...files,
  }
}

/** A sentence that tells the model when to run the check: only `conexus_check`'s description may. */
const WHEN_TO_CHECK =
  /\b(?:run (?:it|the check)|(?:run|call|use) `?conexus_check`?)\b[^.\n]*\b(?:after|before|at the end|each|every|when)\b/i
/** A sentence that says the machine cannot build the app, which it does since step 14. */
const CANNOT_BUILD =
  /\bno (?:bundler|build step)\b|machine[^.\n]*\b(?:cannot|can't|does not|never)\b[^.\n]*\b(?:build|bundle)/i

/** The machine's check passes, so the turn that wrote saves its version. */
function passingCheck(folder: string) {
  mkdirSync(folder, { recursive: true })
  const report = join(folder, 'check-passed')
  const steps = STEP_NAMES.map((name) => ({ name, state: 'passed', problems: [] }))
  writeFileSync(report, JSON.stringify({ ok: true, steps }))
  writeFileSync(join(folder, 'check'), `#!/bin/sh\ncat '${report}'\n`)
  chmodSync(join(folder, 'check'), 0o755)
}

/** A model that keeps every call of the Builder and answers each with `next`, else in words. */
function builderModel(next: (call: Sent, at: number) => Reply | undefined) {
  const calls: Sent[] = []
  function answer(call: Sent): Reply {
    if (title(call) !== undefined) return { kind: 'text', text: 'Título' }
    if (!call.system.includes(BUILDER)) return { kind: 'text', text: 'Observação' }
    calls.push(call)
    return next(call, calls.length - 1) ?? { kind: 'text', text: 'Pronto.' }
  }
  return { calls, answer }
}

/** Each line of the card's table that `system` breaks: an "igual" or "adaptada" missing, a "tirada" there. */
function broken(system: string, values: Filled, starter: boolean): string[] {
  return PROMPT_TABLE.flatMap(({ line, verdict, text }) => {
    const held = system.includes(expectedText(text, values))
    const wanted = verdict === 'tirada' ? false : verdict === 'condicional' ? starter : true
    return held === wanted ? [] : [`${line} ${verdict}: ${text.slice(0, 60)}`]
  })
}

async function firstTurn(t: TestContext, model: ReturnType<typeof builderModel>) {
  const { hub, ana, conversations } = await conversing(t, model.answer)
  passingCheck(hub.builder.folder)
  const turn = await asked(t, { hub, person: ana, conversations }, 'Crie o app de encomendas')
  return { hub, ana, ...turn }
}

test('o prompt tem cada linha "igual" e "adaptada" da tabela, nenhuma "tirada"; a linha 51 enquanto main é o starter (23, 25)', async (t) => {
  const model = builderModel(() => undefined)
  await firstTurn(t, model)
  const first = model.calls[0]
  assert.ok(first)
  assert.deepEqual(broken(first.system, filled(MISSING), true), [])
  for (const word of ['Prévia', 'Integrações', 'Conexão', 'Conexões'])
    assert.ok(!first.system.includes(word), word)
  const skills = readSkills().flatMap(({ content, references }) => [
    content,
    ...Object.values(references),
  ])
  for (const text of [first.system, ...skills]) {
    assert.doesNotMatch(text, WHEN_TO_CHECK)
    assert.doesNotMatch(text, CANNOT_BUILD)
  }
  // The skills come through Mastra's skill tools; the second test sees none in the machine.
  for (const name of ['skill', 'skill_read', 'skill_search'])
    assert.ok(first.tools.includes(name), name)
  for (const name of [
    'conexus-plan-new',
    'conexus-plan-change',
    'conexus-build',
    'conexus-app',
    'conexus-data',
  ])
    assert.ok(first.system.includes(`<name>${name}</name>`), name)
})

test('depois da primeira versão: sem a linha 51, e AGENTS.md e MEMORY.md lidos do main (25)', async (t) => {
  const writes = [
    { path: 'AGENTS.md', content: INSTRUCTIONS },
    { path: '.conexus/memory/MEMORY.md', content: MEMORY },
  ]
  const model = builderModel((_call, at) =>
    at === 0
      ? {
          kind: 'blocks',
          blocks: writes.map((input) => ({ type: 'tool_use', name: WRITE, input })),
        }
      : undefined,
  )
  const { hub, ana, url, events } = await firstTurn(t, model)
  assert.ok(dataOf(events, 'data-conexus-version').length > 0, 'the first turn saved a version')
  assert.equal(endOf(events), 'complete')
  const app = join(hub.builder.folder, 'app')
  const starter = new Set([...readdirSync(STARTER_DIR), '.git', 'AGENTS.md', '.conexus'])
  assert.deepEqual(
    readdirSync(app).filter((name) => !starter.has(name)),
    [],
    'the folder holds the starter and the turn, nothing of the skills',
  )
  assert.equal(existsSync(join(app, 'SKILL.md')), false)
  const before = model.calls.length
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Agora mostre as entregas')).statusCode, 200)
  await stream.turn()
  const second = model.calls[before]
  assert.ok(second)
  const values = filled({ instructions: INSTRUCTIONS.trim(), memory: MEMORY.trim() })
  assert.deepEqual(broken(second.system, values, false), [])
})
