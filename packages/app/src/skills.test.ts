import assert from 'node:assert/strict'
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { APP_CALL_LIMITS } from '@conexus/app-contract'
import { validateSkillContent } from '@mastra/core/skills'
import { spawnRunner } from './check/command.ts'
import { dependencies } from './check/dependencies.ts'
import { manifesto } from './check/manifest.ts'
import type { CheckContext, Outcome } from './check/step.ts'
import { builtPlatform } from './check/test-app.ts'
import { tipos } from './check/types.ts'
import { readSkills } from './skills.ts'
import { STARTER_DIR } from './starter.ts'

// The repository's node_modules holds the starter's packages at their versions, as the machine's
// install would; `npm` itself is the one command faked, for no test reaches the registry (T14).
const MODULES = join(resolve(import.meta.dirname, '../../..'), 'node_modules')
// What npm could not hoist beside the web's other version of the same package.
const OWN_MODULES = join(resolve(import.meta.dirname, '..'), 'node_modules')
const SKILLS = readSkills()

/** Every `.ts` and `.tsx` example of the skills, by `<skill>/<file>`, with the path its first line names in the app. */
const EXAMPLES = new Map<string, { place: string; text: string }>(
  SKILLS.flatMap(({ directory, references }) =>
    Object.entries(references)
      .filter(([name]) => /\.tsx?$/.test(name))
      .map(([name, text]) => {
        const place = /^\/\/ In the app: (\S+)\n/.exec(text)?.[1]
        assert.ok(place, `${directory}/${name} names its place in the app on its first line`)
        return [`${directory}/${name}`, { place, text }] as const
      }),
  ),
)

const DATA = ['conexus-data/operations.ts', 'conexus-data/handlers.ts']
const SCREENS = ['conexus-app/failure.ts', 'conexus-app/dashboard.tsx']
/** The three forms of an app `conexus-app` teaches, each the starter with its examples. */
const FORMS = {
  page: ['conexus-app/page.tsx'],
  panel: [...DATA, ...SCREENS, 'conexus-app/panel.tsx'],
  system: [
    ...DATA,
    ...SCREENS,
    'conexus-app/shell.tsx',
    'conexus-app/ticket-status.tsx',
    'conexus-app/list.tsx',
    'conexus-app/record.tsx',
    'conexus-app/form.tsx',
  ],
} as const

function appOf(t: TestContext, examples: readonly string[], change = (text: string) => text) {
  const root = mkdtempSync(join(tmpdir(), 'conexus-skills-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  cpSync(STARTER_DIR, root, { recursive: true, filter: (path) => !path.includes('node_modules') })
  mkdirSync(join(root, 'node_modules'))
  const linked = new Map(readdirSync(MODULES).map((name) => [name, join(MODULES, name)]))
  for (const name of readdirSync(OWN_MODULES)) linked.set(name, join(OWN_MODULES, name))
  linked.delete('.conexus')
  for (const [name, target] of linked) symlinkSync(target, join(root, 'node_modules', name))
  for (const key of examples) {
    const example = EXAMPLES.get(key)
    assert.ok(example, key)
    mkdirSync(dirname(join(root, example.place)), { recursive: true })
    writeFileSync(join(root, example.place), change(example.text))
  }
  return root
}

/** The check's steps up to the types, as the machine runs them: each must pass for the next to run. */
async function checked(t: TestContext, root: string): Promise<Outcome[]> {
  unlinkSync(join(root, 'node_modules', '@conexus'))
  const ctx: CheckContext = {
    root,
    tools: MODULES,
    platform: builtPlatform(t),
    run: (command, args, options) =>
      command === 'npm'
        ? Promise.resolve({ code: 0, output: '', timedOut: false })
        : spawnRunner(command, args, options),
    browse: async () => ({ unavailable: 'not used' }),
  }
  const outcomes: Outcome[] = []
  for (const step of [dependencies, manifesto, tipos]) {
    const outcome = await step(ctx)
    outcomes.push(outcome)
    if (outcome.state !== 'passed') break
  }
  return outcomes
}

test('cada skill passa em validateSkillContent e o corpo não guarda exemplo fora das referências', () => {
  assert.deepEqual(
    SKILLS.map(({ directory }) => directory),
    ['conexus-app', 'conexus-build', 'conexus-data', 'conexus-plan-change', 'conexus-plan-new'],
  )
  for (const { directory, content } of SKILLS) {
    const result = validateSkillContent({ content, directoryName: directory })
    assert.deepEqual([result.errors, result.warnings], [[], []], directory)
    // Every example is a reference the check below compiles, never a block it would not see.
    assert.doesNotMatch(content, /```tsx?\n/, directory)
  }
})

test('nenhuma skill ensina o caminho conexus/, o runner, o CTE nem a casca do OS', () => {
  for (const { directory, content, references } of SKILLS) {
    for (const text of [content, ...Object.values(references)]) {
      assert.doesNotMatch(text, /conexus_run_operation|`conexus\/|WITH \w+ AS \(|Prévia/, directory)
    }
  }
})

for (const [form, examples] of Object.entries(FORMS)) {
  test(`os exemplos da forma ${form} tipam contra o starter e o SDK`, async (t) => {
    const outcomes = await checked(t, appOf(t, examples))
    assert.deepEqual(outcomes, [{ state: 'passed' }, { state: 'passed' }, { state: 'passed' }])
  })
}

test('cada exemplo entra em alguma forma, e as formas cobrem página, painel e sistema', () => {
  const used = new Set(Object.values(FORMS).flat())
  assert.deepEqual(
    [...EXAMPLES.keys()].filter((key) => !used.has(key)),
    [],
  )
  const app = SKILLS.find(({ directory }) => directory === 'conexus-app')?.content ?? ''
  for (const heading of ['**Page.**', '**Panel.**', '**System.**']) assert.ok(app.includes(heading))
})

test('um exemplo quebrado falha na conferência', async (t) => {
  const broken = appOf(t, FORMS.system, (text) =>
    text.replace("accessor('subject'", "accessor('assunto'"),
  )
  const outcomes = await checked(t, broken)
  const last = outcomes.at(-1)
  assert.equal(last?.state, 'failed')
  assert.ok(
    last?.state === 'failed' && last.problems.some(({ file }) => file?.includes('chamados.tsx')),
  )
})

test('os limites de uma chamada que conexus-data diz são os do contrato', () => {
  const data = SKILLS.find(({ directory }) => directory === 'conexus-data')?.content ?? ''
  const { cpuMs, dbCallsPerCall, callDeadlineMs, statementTimeoutMs } = APP_CALL_LIMITS
  assert.ok(
    data.includes(
      `${cpuMs} ms of CPU and ${dbCallsPerCall} \`db\` calls, ${callDeadlineMs / 1000} s in all, and ${statementTimeoutMs / 1000} s per statement`,
    ),
  )
})

test('conexus-data manda parar e dizer à pessoa quando falta uma peça de @conexus/app', () => {
  const data = SKILLS.find(({ directory }) => directory === 'conexus-data')?.content ?? ''
  assert.match(
    data,
    /When one is missing from the installed `@conexus\/app`.*stop and tell the person which piece is missing.*Never imitate the piece on the screen or in a handler, and never say the rule holds\./,
  )
})
