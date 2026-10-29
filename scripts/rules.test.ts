import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, symlinkSync } from 'node:fs'
import { join } from 'node:path'
import { after, before, test } from 'node:test'
import { biomeLint, plant, ROOT, removePlanted } from './test-rules.ts'

after(removePlanted)

type Violation = { from: string; to: string; rule: { name: string } }

function cruise(dir: string): Violation[] {
  cpSync(join(ROOT, 'tsconfig.base.json'), join(dir, 'tsconfig.base.json'))
  mkdirSync(join(dir, 'node_modules/@conexus'), { recursive: true })
  symlinkSync(join(dir, 'packages/hub-api'), join(dir, 'node_modules/@conexus/hub-api'))
  symlinkSync(join(dir, 'packages/connectors'), join(dir, 'node_modules/@conexus/connectors'))
  const run = spawnSync(
    join(ROOT, 'node_modules/.bin/depcruise'),
    ['.', '--config', join(ROOT, '.dependency-cruiser.cjs'), '--output-type', 'json'],
    { cwd: dir, encoding: 'utf8', timeout: 120_000 },
  )
  return JSON.parse(run.stdout).summary.violations
}

const PUBLIC = 'export const x = 1\n'
function importing(target: string): string {
  return `import { x } from '${target}'\nexport const y = x\n`
}
const BAD_IMPORTS: Record<string, [string, string, Record<string, string>]> = {
  'no-circular': [
    'apps/server/src/platform/a.ts',
    './b.ts',
    { 'apps/server/src/platform/b.ts': importing('./a.ts') },
  ],
  'no-loose-file-in-hub-or-builder': [
    'apps/server/src/hub/loose.ts',
    '../platform/config.ts',
    { 'apps/server/src/platform/config.ts': PUBLIC },
  ],
  'subject-only-through-public': [
    'apps/server/src/hub/a/x.ts',
    '../b/inner.ts',
    { 'apps/server/src/hub/b/inner.ts': PUBLIC },
  ],
  'hub-does-not-import-builder': [
    'apps/server/src/hub/a/h.ts',
    '../../builder/c/public.ts',
    { 'apps/server/src/builder/c/public.ts': PUBLIC },
  ],
  'platform-does-not-import-subject': [
    'apps/server/src/platform/p.ts',
    '../hub/a/public.ts',
    { 'apps/server/src/hub/a/public.ts': PUBLIC },
  ],
  'program-imports-program-by-name': [
    'apps/web/src/hub/a/w.ts',
    '../../../../../packages/hub-api/src/index.ts',
    { 'packages/hub-api/src/index.ts': PUBLIC },
  ],
  'test-enters-through-the-public-door': [
    'apps/server/src/hub/a/a.test.ts',
    './store.ts',
    { 'apps/server/src/hub/a/store.ts': PUBLIC },
  ],
  'platform-test-enters-through-its-own-file': [
    'apps/server/src/platform/access.test.ts',
    './http.ts',
    { 'apps/server/src/platform/http.ts': PUBLIC },
  ],
  'driver-only-in-the-database-modules': [
    'apps/server/src/hub/a/store.ts',
    'pg',
    { 'apps/server/src/hub/a/mapper.ts': importing('drizzle-orm/node-postgres') },
  ],
  'neon-sdk-only-in-the-neon-adapter': ['apps/server/src/hub/a/vendor.ts', '@neon/sdk', {}],
  'mastra-only-in-builder': ['apps/web/src/hub/a/agent.ts', '@mastra/core/agent', {}],
  'e2b-only-in-the-machine': ['apps/server/src/builder/runs/sandbox.ts', 'e2b', {}],
  's3-only-in-the-git-copy': ['apps/server/src/builder/git/bucket.ts', '@aws-sdk/client-s3', {}],
  'connectors-kit-stands-alone': ['packages/connectors/src/x.ts', 'pg', {}],
  'connectors-kit-only-in-the-executor': ['apps/web/src/hub/a/kit.ts', '@conexus/connectors', {}],
  'web-tree-shape': [
    'apps/web/src/components/button.ts',
    '../platform/hub.ts',
    { 'apps/web/src/platform/hub.ts': PUBLIC },
  ],
  'web-support-does-not-import-subject': [
    'apps/web/src/ui/field.ts',
    '../hub/a/public.ts',
    { 'apps/web/src/hub/a/public.ts': PUBLIC },
  ],
  'routes-reach-subject-through-public': [
    'apps/web/src/routes/r.ts',
    '../hub/a/inner.ts',
    { 'apps/web/src/hub/a/inner.ts': PUBLIC },
  ],
}
const GOOD_IMPORTS: Record<string, string> = {
  'apps/server/src/hub/a/ok.ts': '../b/public.ts',
  'apps/server/src/hub/a/ok.test.ts': './public.ts',
  'apps/server/src/platform/health.test.ts': './health.ts',
  'apps/server/src/main.test.ts': './main.ts',
  'apps/server/src/platform/database.ts': 'pg',
  'apps/server/src/platform/migrate.ts': 'drizzle-orm/node-postgres',
  'apps/server/src/platform/database.test.ts': './test-database.ts',
  'apps/server/src/hub/a/ok2.test.ts': '../../platform/test-database.ts',
  'apps/web/src/ui/button.ts': '../platform/hub.ts',
  'apps/web/src/routes/ok.ts': '../hub/b/public.ts',
  'apps/web/src/hub/a/queries.ts': '@conexus/hub-api',
  'apps/web/src/routeTree.gen.ts': './platform/hub.ts',
  'apps/server/src/builder/a/agent.ts': '@mastra/core/agent',
  'apps/server/src/builder/machine/sandbox.ts': 'e2b',
  'apps/server/src/builder/machine/mastra-sandbox.ts': '@mastra/e2b',
  'infra/e2b/template.ts': 'e2b',
  'apps/server/src/builder/git/copy/bucket.ts': '@aws-sdk/client-s3',
  'apps/web/src/builder/a/conversation.ts': '@mastra/client-js',
  'apps/server/src/hub/connectors/executor.ts': '@conexus/connectors',
  'tests/e2e/live-hub.ts': '@conexus/connectors',
}

let violations: Violation[] = []
before(() => {
  const files: Record<string, string> = {
    'packages/hub-api/package.json':
      '{"name":"@conexus/hub-api","type":"module","exports":{".":"./src/index.ts"}}',
    'packages/hub-api/src/index.ts': PUBLIC,
    'packages/connectors/package.json':
      '{"name":"@conexus/connectors","type":"module","exports":{".":"./src/index.ts"}}',
    'packages/connectors/src/index.ts': PUBLIC,
  }
  for (const [file, target, extra] of Object.values(BAD_IMPORTS)) {
    files[file] = importing(target)
    Object.assign(files, extra)
  }
  for (const [file, target] of Object.entries(GOOD_IMPORTS)) files[file] = importing(target)
  for (const file of [
    'apps/server/src/hub/b/public.ts',
    'apps/server/src/platform/health.ts',
    'apps/server/src/platform/hub.ts',
    'apps/server/src/main.ts',
    'apps/server/src/platform/test-database.ts',
    'apps/server/src/hub/a/public.ts',
    'apps/web/src/hub/b/public.ts',
  ]) {
    files[file] ??= PUBLIC
  }
  files['apps/web/src/platform/hub.ts'] ??= PUBLIC
  violations = cruise(plant(files))
})

for (const [rule, [file]] of Object.entries(BAD_IMPORTS)) {
  test(`dependency-cruiser recusa ${rule}`, () => {
    assert.ok(
      violations.some((violation) => violation.rule.name === rule && violation.from === file),
      `${rule} did not fire on ${file}; got ${JSON.stringify(violations.map((v) => `${v.rule.name} ${v.from}`))}`,
    )
  })
}

test('dependency-cruiser recusa o driver de PostgreSQL por outro caminho de importação', () => {
  assert.ok(
    violations.some(
      (violation) =>
        violation.rule.name === 'driver-only-in-the-database-modules' &&
        violation.from === 'apps/server/src/hub/a/mapper.ts',
    ),
  )
})

test('dependency-cruiser aceita as portas públicas', () => {
  const refused = violations.filter((violation) => Object.hasOwn(GOOD_IMPORTS, violation.from))
  assert.deepEqual(refused, [])
})

const BIOME_BAD: Record<string, [string, string, string]> = {
  noDefaultExport: ['apps/server/src/hub/a/d.ts', 'export default function f() {}\n', 'style'],
  noProcessEnv: ['apps/server/src/hub/a/e.ts', 'export const v = process.env.HUB_PORT\n', 'style'],
  noNonNullAssertion: ['apps/server/src/hub/a/n.ts', 'export const v = [1].at(0)!\n', 'style'],
  noExplicitAny: ['apps/server/src/hub/a/y.ts', 'export const v: any = 1\n', 'suspicious'],
  noEmptyBlockStatements: [
    'apps/server/src/hub/a/c.ts',
    'try {\n  JSON.parse("1")\n} catch {}\n',
    'suspicious',
  ],
  useConsistentFunctionStyle: [
    'apps/server/src/hub/a/f.ts',
    'export const f = () => 1\n',
    'nursery',
  ],
  noThisOutsideOfClass: [
    'apps/server/src/hub/a/t.ts',
    'export function f() {\n  return this\n}\n',
    'nursery',
  ],
  noUnsafeTypeAssertion: [
    'apps/server/src/hub/a/u.ts',
    'const x: unknown = 1\nexport const v = x as number\n',
    'nursery',
  ],
  useConsistentTypeDefinitions: [
    'apps/server/src/hub/a/i.ts',
    'export interface A {\n  a: string\n}\n',
    'style',
  ],
  useImportType: [
    'apps/server/src/hub/a/m.ts',
    "import { A } from './i.ts'\nexport const v: A = { a: '' }\n",
    'style',
  ],
  noRestrictedImports: [
    'apps/server/src/hub/a/r.test.ts',
    "import { test } from 'vitest'\ntest('x', () => {})\n",
    'style',
  ],
  noRestrictedGlobals: [
    'apps/web/src/hub/a/q.ts',
    "export const v = fetch('/api/health')\n",
    'style',
  ],
  noInlineStyles: [
    'apps/web/src/ui/inline.tsx',
    'export const inline = <div style={{ color: "red" }} />\n',
    'nursery',
  ],
  noExcessiveLinesPerFunction: [
    'apps/server/src/hub/a/l.ts',
    `export function f() {\n${'  console.log(1)\n'.repeat(61)}}\n`,
    'complexity',
  ],
  noExcessiveLinesPerFile: [
    'apps/server/src/hub/a/z.ts',
    'export const a = 1\n'.repeat(301),
    'style',
  ],
}

let lint = ''
before(() => {
  const files: Record<string, string> = {}
  for (const [file, content] of Object.values(BIOME_BAD)) files[file] = content
  lint = biomeLint(files).output
})

for (const [rule, [file, , group]] of Object.entries(BIOME_BAD)) {
  test(`Biome recusa ${rule}`, () => {
    assert.ok(
      lint.includes(`${file}:`) &&
        new RegExp(`${file.replaceAll('.', '\\.')}:\\d+:\\d+ lint/${group}/${rule}`).test(lint),
      `${rule} did not fire on ${file}`,
    )
  })
}

test('Biome aceita fetch na peça do Hub, classe em ui e style fora das peças próprias', () => {
  const run = biomeLint({
    'apps/web/src/ui/tokens.tsx': 'export const tokens = <div className="text-text" />\n',
    'apps/web/src/platform/vendor.tsx': 'export const vendor = <div style={{ color: "red" }} />\n',
    'apps/web/src/platform/hub.ts': "export function ping() {\n  return fetch('/api/health')\n}\n",
  })
  assert.equal(run.status, 0, run.output)
})

test('V23: o Biome recusa max-w-sm e w-2xl em apps/web/src, aceita min-w-48', () => {
  const run = biomeLint({
    'apps/web/src/ui/a.tsx': 'export const a = <p className="max-w-sm" />\n',
    'apps/web/src/ui/b.ts': `export const b = ['flex', \`w-2xl \${String(1)}\`]\n`,
    'apps/web/src/ui/c.tsx': 'export const c = <p className="min-w-48 max-w-prose min-w-0" />\n',
  })
  const flagged = [...run.output.matchAll(/^(apps\/web\/src\/ui\/\w+\.tsx?):\d+:\d+ plugin/gm)]
  assert.deepEqual(
    flagged.map(([, file]) => file),
    ['apps/web/src/ui/a.tsx', 'apps/web/src/ui/b.ts'],
    run.output,
  )
})
