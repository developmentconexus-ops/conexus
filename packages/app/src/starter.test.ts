import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { test } from 'node:test'
import { STARTER_DIR } from './starter.ts'

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)],
  )
}

const files = filesUnder(STARTER_DIR).map((file) => relative(STARTER_DIR, file))
function read(path: string): string {
  return readFileSync(join(STARTER_DIR, path), 'utf8')
}

test('o starter é um app só de telas: uma rota, os provedores, nada de servidor', () => {
  assert.ok(files.includes('src/main.tsx') && files.includes('src/router.tsx'))
  assert.ok(files.includes('src/routes/home.tsx'))
  assert.equal(files.filter((file) => /^(server|shared)\//.test(file)).length, 0)
  assert.match(read('src/routes/home.tsx'), /Este app ainda está vazio/)
  assert.match(read('src/main.tsx'), /<CSPProvider disableStyleElements>/)
  assert.match(read('src/lib/date-codec.ts'), /export const isoDate = z\.codec\(/)
})

test('o starter não injeta elemento <style>, que a política do app recusa', () => {
  const sources = files.filter((file) => /^src\/.*\.tsx?$/.test(file))
  for (const file of sources) {
    const source = read(file)
    assert.doesNotMatch(
      source,
      /<style[\s>]|createElement\(['"]style/,
      `${file}: injected style element`,
    )
  }
})

test('toda dependência do starter tem versão exata e todo componente leva a licença', () => {
  const { dependencies } = JSON.parse(read('package.json'))
  for (const [name, version] of Object.entries<string>(dependencies)) {
    assert.match(version, /^\d+\.\d+\.\d+$/, name)
  }
  assert.ok(files.includes('src/components/ui/LICENSE-shadcn-ui.txt'))
  for (const file of files.filter((each) => /^src\/components\/ui\/.*\.tsx$/.test(each))) {
    assert.match(read(file), /shadcn\/ui .*MIT License/, file)
  }
})
