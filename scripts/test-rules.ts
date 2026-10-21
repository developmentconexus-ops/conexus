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
  for (const grit of ['w25', 'conexus-code']) {
    cpSync(join(ROOT, `scripts/${grit}.grit`), join(dir, `scripts/${grit}.grit`))
  }
  const run = spawnSync(
    join(ROOT, 'node_modules/.bin/biome'),
    ['lint', '--colors=off', '--max-diagnostics=500', '.'],
    { cwd: dir, encoding: 'utf8', timeout: 120_000 },
  )
  return { status: run.status, output: run.stdout + run.stderr }
}
