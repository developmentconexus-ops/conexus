import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { parse } from 'yaml'
import { z } from 'zod'

// DESIGN.md's front matter is the one source of the brand's values; tokens.css writes them for the
// browser. This test reads both and refuses a difference in either direction, by token name.
const DESIGN = readFileSync(new URL('../../../../DESIGN.md', import.meta.url), 'utf8')
const CSS = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')

const Section = z.record(z.string(), z.union([z.string(), z.number()]))
const Front = z.object({
  colors: Section,
  typography: z.record(z.string(), Section),
  rounded: Section,
  spacing: Section,
  containers: Section,
  shadows: Section,
})
type Front = z.infer<typeof Front>

function frontMatter(): Front {
  const match = /^---\n([\s\S]*?)\n---/.exec(DESIGN)
  if (!match?.[1]) throw new Error('DESIGN.md has no front matter')
  return Front.parse(parse(match[1]))
}

/** A value as the two files may spell it differently: case, spacing and quotes carry no meaning. */
function plain(value: string | number): string {
  return String(value)
    .replace(/["']/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim()
    .toLowerCase()
}

/** The declarations written directly inside `@theme { ... }`, nested blocks (keyframes) skipped. */
function themeDeclarations(): Map<string, string> {
  const css = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
  const open = css.indexOf('@theme {')
  if (open < 0) throw new Error('tokens.css has no @theme block')
  const found = new Map<string, string>()
  let depth = 0
  let statement = ''
  for (const char of css.slice(open + '@theme '.length)) {
    if (char === '{') {
      depth += 1
      if (depth > 1) statement = ''
    } else if (char === '}') {
      depth -= 1
      statement = ''
      if (depth === 0) break
    } else if (char === ';' && depth === 1) {
      const split = statement.indexOf(':')
      if (split > 0) found.set(statement.slice(0, split).trim(), plain(statement.slice(split + 1)))
      statement = ''
    } else if (depth === 1) statement += char
  }
  return found
}

/** What DESIGN.md says each theme variable is, keyed by the variable's name. */
function expectedDeclarations(front: Front): Map<string, string> {
  const expected = new Map<string, string>()
  function put(name: string, value: string | number) {
    expected.set(name, plain(value))
  }
  for (const name of Object.keys(front.colors)) {
    if (name.startsWith('dark-')) continue
    const dark = front.colors[`dark-${name}`]
    put(`--color-${name}`, `light-dark(${front.colors[name]}, ${dark})`)
  }
  for (const [name, type] of Object.entries(front.typography)) {
    if (name === 'fact') {
      put('--font-mono', type.fontFamily ?? '')
      put('--text-fact--font-feature-settings', type.fontFeature ?? '')
    } else {
      put('--font-display', type.fontFamily ?? '')
      put('--font-body', type.fontFamily ?? '')
    }
    put(`--text-${name}`, type.fontSize ?? '')
    put(`--text-${name}--line-height`, type.lineHeight ?? '')
    put(`--text-${name}--font-weight`, type.fontWeight ?? '')
    if (type.letterSpacing !== undefined) put(`--text-${name}--letter-spacing`, type.letterSpacing)
  }
  for (const [name, value] of Object.entries(front.rounded)) put(`--radius-${name}`, value)
  for (const [name, value] of Object.entries(front.spacing)) put(`--spacing-${name}`, value)
  for (const [name, value] of Object.entries(front.containers)) put(`--container-${name}`, value)
  for (const [name, value] of Object.entries(front.shadows)) put(`--shadow-${name}`, value)
  return expected
}

// The scales DESIGN.md owns; an animation, an easing or a keyframe is not one of its tokens.
const OWNED = /^--(color|text|font|radius|spacing|container|shadow)-/

test('cada token do DESIGN.md é o mesmo valor em tokens.css, e tokens.css não tem um que o DESIGN.md não tem', () => {
  const expected = expectedDeclarations(frontMatter())
  const actual = new Map(
    [...themeDeclarations()].filter(([name]) => OWNED.test(name) && name !== '--color-*'),
  )
  const differences: string[] = []
  for (const [name, value] of expected) {
    const written = actual.get(name)
    if (written === undefined) differences.push(`${name}: DESIGN.md has it, tokens.css does not`)
    else if (written !== value) {
      differences.push(`${name}: DESIGN.md says "${value}", tokens.css says "${written}"`)
    }
  }
  for (const name of actual.keys()) {
    if (!expected.has(name)) differences.push(`${name}: tokens.css has it, DESIGN.md does not`)
  }
  assert.deepEqual(differences, [])
})

test('o tema escuro é escrito uma vez: por light-dark() e color-scheme, sem um bloco de cores por tema', () => {
  const css = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
  assert.match(css, /:root\s*{\s*color-scheme:\s*light dark;?\s*}/)
  assert.match(css, /:root\[data-theme="light"\]\s*{\s*color-scheme:\s*light;?\s*}/)
  assert.match(css, /:root\[data-theme="dark"\]\s*{\s*color-scheme:\s*dark;?\s*}/)
  assert.equal(css.match(/--color-canvas:/g)?.length, 1)
})
