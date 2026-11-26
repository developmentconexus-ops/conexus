import { spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

export const ROOT = resolve(import.meta.dirname, '..')
const dirs: string[] = []
export function removePlanted() {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
}

export function plant(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-rules-'))
  dirs.push(dir)
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  return dir
}

function biomeConfig(): string {
  const config = JSON.parse(readFileSync(join(ROOT, 'biome.json'), 'utf8'))
  delete config.vcs
  return JSON.stringify(config)
}

export function biomeLint(files: Record<string, string>) {
  const dir = plant({ 'biome.json': biomeConfig(), ...files })
  for (const grit of ['w25', 'conexus-code', 'neon-names', 'library-shapes', 'test-waits']) {
    cpSync(join(ROOT, `scripts/${grit}.grit`), join(dir, `scripts/${grit}.grit`))
  }
  const run = spawnSync(
    join(ROOT, 'node_modules/.bin/biome'),
    ['lint', '--colors=off', '--max-diagnostics=500', '.'],
    { cwd: dir, encoding: 'utf8', timeout: 120_000 },
  )
  return { status: run.status, output: run.stdout + run.stderr }
}

export const PUBLIC = 'export const x = 1\n'
export function importing(target: string): string {
  return `import { x } from '${target}'\nexport const y = x\n`
}
/** One planted file per dependency-cruiser rule: the file, what it imports, and the files that import needs. */
export const BAD_IMPORTS: Record<string, [string, string, Record<string, string>]> = {
  'no-circular': [
    'apps/server/src/platform/a.ts',
    './b.ts',
    { 'apps/server/src/platform/b.ts': importing('./a.ts') },
  ],
  'no-loose-file-in-a-subject': [
    'apps/server/src/hub/loose.ts',
    '../platform/config.ts',
    { 'apps/server/src/platform/config.ts': PUBLIC },
  ],
  'subject-only-through-public': [
    'apps/server/src/hub/a/x.ts',
    '../b/inner.ts',
    { 'apps/server/src/hub/b/inner.ts': PUBLIC },
  ],
  'hub-does-not-import-harness-or-agents': [
    'apps/server/src/hub/a/h.ts',
    '../../agents/c/public.ts',
    { 'apps/server/src/agents/c/public.ts': PUBLIC },
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
  'neon-http-driver-only-in-its-adapters': [
    'apps/server/src/hub/a/http-driver.ts',
    '@neondatabase/serverless',
    {},
  ],
  // @mastra/core resolves (rules.test.ts links it), as a real import does: the cruise keeps Mastra's packages as leaves.
  'mastra-only-in-harness-and-agents': ['apps/web/src/hub/a/agent.ts', '@mastra/core/agent', {}],
  'e2b-only-in-the-machine': ['apps/server/src/agents/app-builder/runs/sandbox.ts', 'e2b', {}],
  's3-only-in-the-git-copy': [
    'apps/server/src/agents/app-builder/git/bucket.ts',
    '@aws-sdk/client-s3',
    {},
  ],
  'aws-sdk-only-in-the-aws-adapter': [
    'apps/server/src/hub/a/stacks.ts',
    '@aws-sdk/client-cloudformation',
    Object.fromEntries(
      ['ecs', 'sqs', 'ssm', 'athena'].map((client) => [
        `apps/server/src/hub/a/${client}.ts`,
        importing(`@aws-sdk/client-${client}`),
      ]),
    ),
  ],
  'connectors-kit-stands-alone': ['packages/connectors/src/x.ts', 'pg', {}],
  'connectors-kit-only-in-the-executor': ['apps/web/src/hub/a/kit.ts', '@conexus/connectors', {}],
  // Criterion 20 of the first-copy card: a connector's file and a connector's name, planted in the adapter.
  'adapter-reads-only-the-kit-index': [
    'apps/extraction/tap/src/read.ts',
    '../../../../packages/connectors/src/sankhya/definition.ts',
    { 'packages/connectors/src/sankhya/definition.ts': PUBLIC },
  ],
  'adapter-names-no-connector': [
    'apps/extraction/tap/src/name.ts',
    '@conexus/connectors/hubspot',
    {},
  ],
  'app-reads-kit-types-only': ['packages/app/src/run.ts', '@conexus/connectors/calls', {}],
  'app-reads-only-the-kit-calls': [
    'packages/app/src/kit.ts',
    '@conexus/connectors',
    {
      'packages/app/src/kit.ts':
        "import type { x } from '@conexus/connectors'\nexport type y = typeof x\n",
    },
  ],
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
  'web-harness-imports-no-agent': [
    'apps/web/src/harness/a/room.ts',
    '../../agents/assistant/public.ts',
    { 'apps/web/src/agents/assistant/public.ts': PUBLIC },
  ],
  'web-agent-imports-no-other-agent': [
    'apps/web/src/agents/saved-agent/a.ts',
    '../agent-builder/public.ts',
    { 'apps/web/src/agents/agent-builder/public.ts': PUBLIC },
  ],
  'web-agent-builder-imports-only-the-saved-agent': [
    'apps/web/src/agents/agent-builder/a.ts',
    '../app-builder/public.ts',
    { 'apps/web/src/agents/app-builder/public.ts': PUBLIC },
  ],
  'routes-reach-subject-through-public': [
    'apps/web/src/routes/r.ts',
    '../hub/a/inner.ts',
    { 'apps/web/src/hub/a/inner.ts': PUBLIC },
  ],
  'access-reaches-no-owner': [
    'apps/server/src/hub/access/x.ts',
    '../copies/public.ts',
    { 'apps/server/src/hub/copies/public.ts': PUBLIC },
  ],
  'describe-lists-only-through-access': [
    'apps/server/src/hub/data/catalog.ts',
    '../connectors/public.ts',
    { 'apps/server/src/hub/connectors/public.ts': PUBLIC },
  ],
}
