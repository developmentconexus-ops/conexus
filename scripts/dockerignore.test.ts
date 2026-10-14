import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const DOCKERIGNORE = resolve(import.meta.dirname, '../.dockerignore')
const dir = mkdtempSync(join(tmpdir(), 'conexus-dockerignore-'))
after(() => rmSync(dir, { recursive: true, force: true }))

const PLANTED = [
  '.env',
  '.env.local',
  'secrets/key',
  'apps/server/.env',
  'apps/server/.env.production',
  'apps/server/secrets/key',
  'packages/hub-api/node_modules/x',
  'apps/web/dist/x',
]
const KEPT = ['apps/server/src/main.ts']

test('o contexto da imagem deixa fora ambiente, segredo e saída de build, em qualquer pasta', () => {
  const context = join(dir, 'context')
  for (const path of [...PLANTED, ...KEPT]) {
    mkdirSync(dirname(join(context, path)), { recursive: true })
    writeFileSync(join(context, path), 'x')
  }
  copyFileSync(DOCKERIGNORE, join(context, '.dockerignore'))
  writeFileSync(join(context, 'Dockerfile'), 'FROM scratch\nCOPY . /context\n')
  const out = join(dir, 'out')
  const build = spawnSync(
    'docker',
    ['build', '--quiet', '--output', `type=local,dest=${out}`, context],
    { encoding: 'utf8' },
  )
  assert.equal(build.status, 0, build.stderr)
  for (const path of PLANTED) assert.equal(existsSync(join(out, 'context', path)), false, path)
  for (const path of KEPT) assert.equal(existsSync(join(out, 'context', path)), true, path)
})
