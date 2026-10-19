import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, before, test } from 'node:test'

// Plants each refusal of scripts/conexus-code.grit, and the Biome rules turned on beside it, in a
// copy of the configuration, and plants the code each rule must accept.

const ROOT = resolve(import.meta.dirname, '..')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

const SERVER = 'apps/server/src/hub/a'
const BAD: Record<string, [string, string]> = {
  'C27 JSON.parse': [`${SERVER}/c27a.ts`, 'export const v = JSON.parse("1")\n'],
  'C27 .json()': [
    `${SERVER}/c27b.ts`,
    'export async function f(r: Response) {\n  return await r.json()\n}\n',
  ],
  'C48 Error code': [`${SERVER}/c48.ts`, "export const e = new Error('SOME_CODE')\n"],
  'C53 literal return': [
    `${SERVER}/c53a.ts`,
    'export function f() {\n  try {\n    return g()\n  } catch {\n    return null\n  }\n}\nfunction g() {\n  return 1\n}\n',
  ],
  'C53 bare return': [
    `${SERVER}/c53b.ts`,
    'export function f() {\n  try {\n    g()\n  } catch (e) {\n    return\n  }\n}\nfunction g() {}\n',
  ],
  'C53 comment only': [
    `${SERVER}/c53c.ts`,
    'export function f() {\n  try {\n    g()\n  } catch {\n    // ignore\n  }\n}\nfunction g() {\n  return 1\n}\n',
  ],
  'C53 .catch literal': [
    `${SERVER}/c53d.ts`,
    'export function f(p: Promise<number>) {\n  return p.catch(() => undefined)\n}\n',
  ],
  'C23 id string': [
    `${SERVER}/c23a.ts`,
    'export function f(companyId: string) {\n  return companyId\n}\n',
  ],
  'C23 id string | null': [`${SERVER}/c23b.ts`, 'export type T = { personId: string | null }\n'],
  useThrowOnlyError: [`${SERVER}/t.ts`, "export function f() {\n  throw 'x'\n}\n"],
  useExhaustiveSwitchCases: [
    `${SERVER}/s.ts`,
    "export function f(k: 'a' | 'b') {\n  switch (k) {\n    case 'a':\n      return 1\n  }\n  return 0\n}\n",
  ],
  noFloatingPromises: [
    `${SERVER}/p.ts`,
    'async function g() {\n  return 1\n}\nexport function f() {\n  g()\n}\n',
  ],
}
const GOOD: Record<string, string> = {
  [`${SERVER}/ok1.ts`]: [
    "import { z } from 'zod'",
    'const S = z.number()',
    'export async function f(r: Response) {',
    '  const a = S.parse(JSON.parse("1"))',
    '  const b = S.safeParse(await r.json())',
    '  const c = S.parse(await r.json().catch(() => ({})))',
    '  return [a, b, c]',
    '}',
    '',
  ].join('\n'),
  [`${SERVER}/ok2.ts`]: [
    "export const e = new Error('the reply passed the cap')",
    'export function f(g: () => number, log: (e: unknown) => void) {',
    '  try {',
    '    return g()',
    '  } catch (error) {',
    '    log(error)',
    '    return null',
    '  }',
    '}',
    'export function h(traceId: string, keyId: string, id: number) {',
    '  return [traceId, keyId, id]',
    '}',
    '',
  ].join('\n'),
  'apps/web/src/hub/ok3.ts': 'export function f(companyId: string) {\n  return companyId\n}\n',
  [`${SERVER}/ok5.test.ts`]: 'export const v = JSON.parse("1")\n',
}

let output = ''
before(() => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-code-'))
  dirs.push(dir)
  const config = JSON.parse(readFileSync(join(ROOT, 'biome.json'), 'utf8'))
  delete config.vcs
  writeFileSync(join(dir, 'biome.json'), JSON.stringify(config))
  mkdirSync(join(dir, 'scripts'))
  for (const grit of ['w25.grit', 'conexus-code.grit']) {
    cpSync(join(ROOT, 'scripts', grit), join(dir, 'scripts', grit))
  }
  const files = { ...Object.fromEntries(Object.values(BAD)), ...GOOD }
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  const run = spawnSync(
    join(ROOT, 'node_modules/.bin/biome'),
    ['lint', '--colors=off', '--max-diagnostics=500', 'apps'],
    { cwd: dir, encoding: 'utf8', timeout: 120_000 },
  )
  output = run.stdout + run.stderr
})

function marker(name: string): string {
  if (!name.startsWith('C')) return name
  const rule = name.split(' ')[0]
  return `× ${rule === 'C48' ? 'C48, C49' : rule}:`
}

for (const [name, [file]] of Object.entries(BAD)) {
  test(`Biome recusa ${name}`, () => {
    const blocks = output.split(/\n(?=\S+:\d+:\d+ )/)
    assert.ok(
      blocks.some((block) => block.startsWith(`${file}:`) && block.includes(marker(name))),
      output,
    )
  })
}

test('Biome aceita o código que as regras de conexus-code.grit deixam passar', () => {
  const flagged = [...output.matchAll(/^(\S*\/ok\d[^:\s]*):\d+:\d+ /gm)].map(([, file]) => file)
  assert.deepEqual(flagged, [], output)
})

test('cada recusa de conexus-code.grit diz a regra do guia', () => {
  for (const rule of ['C23', 'C27', 'C48, C49', 'C53']) {
    assert.ok(output.includes(`× ${rule}: `), `${rule} has no message`)
  }
})
