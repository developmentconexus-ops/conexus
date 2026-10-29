import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'

// The help site is static: the files its Worker serves as they are, built by `npm run build -w
// @conexus/help`, are its public door (testing T5).
const HELP = new URL('../../apps/help/', import.meta.url)
const DIST = new URL('dist/', HELP)
function read(url: URL): string {
  return readFileSync(url, 'utf8')
}

function page(name: string): string {
  return read(new URL(name, DIST))
}

function files(dir: URL): URL[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? files(new URL(`${entry.name}/`, dir)) : [new URL(entry.name, dir)],
  )
}

test('o site montado em português, com busca, 404 e cabeçalhos', () => {
  const index = page('index.html')
  assert.match(index, /<html lang="pt-BR"/)
  assert.match(index, /<title>Ajuda do Conexus \| Ajuda do Conexus<\/title>/)
  assert.match(index, /<link rel="canonical" href="https:\/\/ajuda\.conexus\.fun\/"\/?>/)
  assert.match(index, /Pesquisar/)
  assert.ok(JSON.parse(page('pagefind/pagefind-entry.json')))

  const notFound = page('404.html')
  assert.match(notFound, /<title>Página não encontrada \| Ajuda do Conexus<\/title>/)
  assert.match(notFound, /Pesquisar/)
  assert.match(notFound, /<a href="\/"/)

  const headers = page('_headers')
  assert.match(headers, /^\/\*\n/)
  for (const line of [
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy: strict-origin-when-cross-origin',
    "Content-Security-Policy: frame-ancestors 'none'",
  ])
    assert.ok(
      headers.split('\n').some((each) => each.trim() === line),
      line,
    )
})

test('as cores e as fontes do Hub, de um só arquivo', () => {
  const palette = read(new URL('../../apps/web/src/brand/palette.css', import.meta.url))
  const accent = /^:root \{[^}]*?--brand-accent: (#[0-9a-f]+);/ms.exec(palette)?.[1]
  assert.ok(accent, 'palette.css has no light --brand-accent')

  const built = files(new URL('_astro/', DIST))
  const css = built
    .filter((url) => url.pathname.endsWith('.css'))
    .map(read)
    .join('\n')
  assert.ok(css.includes(`--brand-accent:${accent}`), 'the built sheet lacks the Hub light accent')
  assert.match(css, /--sl-color-accent:var\(--brand-accent\)/)
  assert.match(css, /--sl-font:var\(--brand-font-body\)/)
  for (const font of ['BricolageGrotesque', 'HankenGrotesk', 'JetBrainsMono'])
    assert.ok(
      built.some((url) => url.pathname.includes(font) && url.pathname.endsWith('.woff2')),
      `${font} is not in dist/_astro`,
    )

  // The brand (design V3) owns every colour: the site only points at it.
  const RAW_COLOUR = /#[0-9a-f]{3,8}\b|\brgba?\(|\boklch\(|\bhsla?\(/i
  for (const url of files(new URL('src/', HELP)).filter((each) =>
    /\.(css|ts|md)$/.test(each.pathname),
  ))
    assert.doesNotMatch(
      read(url),
      RAW_COLOUR,
      join('apps/help/src', url.pathname.split('/src/')[1] ?? ''),
    )
})

test('o Worker sem rota, com a 404', () => {
  const config = read(new URL('wrangler.jsonc', HELP))
  assert.doesNotMatch(config, /"routes"|"route"|custom_domain/)
  assert.match(config, /"workers_dev": false/)
  assert.match(config, /"not_found_handling": "404-page"/)
})
