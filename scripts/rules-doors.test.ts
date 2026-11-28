import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { plant, ROOT, removePlanted } from './test-rules.ts'

// The doors of the server (code C4, C8, testing T5): each rule refuses one planted file and
// accepts its lawful twin. The rest of the import law is planted in rules.test.ts.
after(removePlanted)

type Violation = { from: string; rule: { name: string } }

const PUBLIC = 'export const x = 1\n'
function importing(target: string): string {
  return `import { x } from '${target}'\nexport const y = x\n`
}

const SRC = 'apps/server/src'
const BAD: Record<string, [string, string]> = {
  'server-root-only-through-public': [`${SRC}/conversations-of.ts`, './hub/c/inner.ts'],
  'table-door-only-for-foreign-keys-and-schema': [`${SRC}/hub/a/join.ts`, '../b/public-tables.ts'],
  // A folder inside a subject has no door of its own.
  'subject-only-through-public': [`${SRC}/hub/a/nested.ts`, '../b/mail/public.ts'],
  'agents-and-apps-reach-data-only-through-the-contract': [
    `${SRC}/harness/memory/x.ts`,
    '../../hub/connectors/public.ts',
  ],
  'data-read-only-through-the-recorder': [`${SRC}/hub/data/other.ts`, './tables.ts'],
}
const GOOD: Record<string, string> = {
  [`${SRC}/main.ts`]: './hub/b/public.ts',
  [`${SRC}/hub/a/mail.tsx`]: '../b/public-mail.tsx',
  [`${SRC}/hub/a/tables.ts`]: '../b/public-tables.ts',
  [`${SRC}/hub/a/ok.test.ts`]: '../b/test-thing.ts',
  [`${SRC}/hub/data/record.ts`]: './tables.ts',
}

let violations: Violation[] = []
before(() => {
  const files: Record<string, string> = {
    [`${SRC}/hub/b/public.ts`]: PUBLIC,
    [`${SRC}/hub/b/public-tables.ts`]: PUBLIC,
    [`${SRC}/hub/b/public-mail.tsx`]: PUBLIC,
    [`${SRC}/hub/b/mail/public.ts`]: PUBLIC,
    [`${SRC}/hub/b/test-thing.ts`]: PUBLIC,
    [`${SRC}/hub/c/inner.ts`]: PUBLIC,
    [`${SRC}/hub/connectors/public.ts`]: PUBLIC,
    [`${SRC}/hub/connectors/test-connections.ts`]: PUBLIC,
    [`${SRC}/hub/data/tables.ts`]: PUBLIC,
  }
  for (const [file, target] of [...Object.values(BAD), ...Object.entries(GOOD)]) {
    files[file] = importing(target)
  }
  const dir = plant(files)
  cpSync(join(ROOT, 'tsconfig.base.json'), join(dir, 'tsconfig.base.json'))
  const run = spawnSync(
    join(ROOT, 'node_modules/.bin/depcruise'),
    ['.', '--config', join(ROOT, '.dependency-cruiser.cjs'), '--output-type', 'json'],
    { cwd: dir, encoding: 'utf8', timeout: 120_000 },
  )
  violations = JSON.parse(run.stdout).summary.violations
})

for (const [rule, [file]] of Object.entries(BAD)) {
  test(`dependency-cruiser recusa ${rule} em ${file}`, () => {
    assert.ok(
      violations.some((violation) => violation.rule.name === rule && violation.from === file),
      `${rule} did not fire on ${file}; got ${JSON.stringify(violations.map((v) => `${v.rule.name} ${v.from}`))}`,
    )
  })
}

test('dependency-cruiser aceita a raiz, o tables.ts, a porta .tsx, o ajudante test-*.ts e a lista de migração do contrato', () => {
  assert.deepEqual(
    violations.filter((violation) => Object.hasOwn(GOOD, violation.from)),
    [],
  )
})

/** The files that still reach the data directly today: the list only shrinks, and a name that leaves leaves here in the same commit. */
const MIGRATION_TODAY = ([] as string[])
  .map((file) => `^apps/server/src/${file}\\.ts$`)
  .concat('^packages/app/src/connectors\\.ts$')

function grown(listed: readonly string[]): string[] {
  return listed.filter((one) => !MIGRATION_TODAY.includes(one))
}

/** The rule's own list: the files its `pathNot` names one by one, wherever they sit; the tests and the test helpers are patterns. */
function listedToday(): string[] {
  const config = createRequire(import.meta.url)(join(ROOT, '.dependency-cruiser.cjs'))
  const rule = config.forbidden.find(
    (one: { name: string }) => one.name === 'agents-and-apps-reach-data-only-through-the-contract',
  )
  return rule.from.pathNot.filter((one: string) => !one.includes('.*'))
}

test('a lista de migração do contrato não cresce', () => {
  assert.deepEqual(grown(listedToday()), [])
  assert.deepEqual(grown(MIGRATION_TODAY.slice(1)), [], 'one name fewer passes')
})

test('um nome novo na lista falha', () => {
  const added = '^apps/server/src/harness/tools/app-data/check\\.ts$'
  assert.deepEqual(grown([...MIGRATION_TODAY, added]), [added])
})
