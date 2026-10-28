import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { cn } from './cn.ts'

// tokens.css owns the brand's scales; `cn` must merge every size, radius and space it declares.
const TOKENS = readFileSync(new URL('../brand/tokens.css', import.meta.url), 'utf8')

function scale(name: string): string[] {
  const names = [
    ...TOKENS.matchAll(new RegExp(`^\\s*--${name}-([a-z0-9]+(?:-[a-z0-9]+)*):`, 'gm')),
  ].map(([, each]) => each ?? '')
  return [...new Set(names)]
}

test('cada tamanho, raio e espaço do tokens.css fica ao lado de uma cor, e o último da mesma escala vence', () => {
  const sizes = scale('text')
  const radii = scale('radius')
  const spaces = scale('spacing')
  assert.ok(sizes.length > 0 && radii.length > 0 && spaces.length > 0, 'tokens.css has no scales')
  for (const size of sizes) {
    assert.equal(cn(`text-${size} text-text-2`), `text-${size} text-text-2`)
    assert.equal(cn(`text-${size === 'body' ? 'label' : 'body'}`, `text-${size}`), `text-${size}`)
  }
  for (const radius of radii)
    assert.equal(cn('rounded-[3px]', `rounded-${radius}`), `rounded-${radius}`)
  for (const space of spaces) assert.equal(cn('px-[3px]', `px-${space}`), `px-${space}`)
})
