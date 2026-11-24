import { readdirSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import {
  conversationsNone,
  hubServer,
  PEDIDOS,
  projectsRead,
  refusal,
} from '../../platform/test-hub.tsx'

const server = hubServer()
const CODE = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}?lens=code`
const SOURCE = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/source`
const COMMIT = 'a'.repeat(40)
const VIEW = { projects: [PEDIDOS], databaseReady: true, mayDelete: true }

beforeEach(() => server.use(conversationsNone, ...projectsRead(VIEW)))

function source(files: { path: string; bytes: number }[], version = 1) {
  return http.get(SOURCE, () =>
    HttpResponse.json(
      version === 0
        ? { version, commit: null, savedAt: null, files }
        : { version, commit: COMMIT, savedAt: '2026-10-21T12:00:00.000Z', files },
    ),
  )
}

/** A line of code, whole: colouring splits it into one span per token. */
function line(text: RegExp) {
  return (_: string, element: Element | null) =>
    element?.getAttribute('data-slot') === 'code-block-line-content' &&
    text.test(element.textContent ?? '')
}

function open() {
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [CODE] }))} />)
}

test('sem versão: o vazio diz para pedir um app na Conversa', async () => {
  server.use(source([], 0))
  open()
  expect(
    await screen.findByText(/Nenhuma versão guardada ainda\. Peça um app na Conversa\./),
  ).toBeTruthy()
})

test('com versão: a lista de arquivos pelo teclado, o texto do escolhido e a versão', async () => {
  const requested: string[] = []
  server.use(
    source([
      { path: 'a.ts', bytes: 2 },
      { path: 'b.ts', bytes: 2 },
    ]),
    http.get(`${SOURCE}/file`, ({ request }) => {
      const url = new URL(request.url)
      requested.push(`${url.searchParams.get('commit')}:${url.searchParams.get('path')}`)
      return HttpResponse.json({ text: `texto de ${url.searchParams.get('path')}\n` })
    }),
  )
  open()
  expect(await screen.findByText(/Versão 1, guardada em/)).toBeTruthy()
  const first = await screen.findByRole('treeitem', { name: 'a.ts' })
  expect(first.getAttribute('aria-selected')).toBe('true')
  expect(first.className).not.toContain('hover:bg')
  expect(await screen.findByRole('region', { name: 'Conteúdo de a.ts' })).toBeTruthy()
  expect(screen.getByText(line(/texto de a\.ts/))).toBeTruthy()
  const second = screen.getByRole('treeitem', { name: 'b.ts' })
  second.focus()
  fireEvent.click(second)
  expect(await screen.findByText(line(/texto de b\.ts/))).toBeTruthy()
  expect(second.getAttribute('aria-selected')).toBe('true')
  expect(requested).toEqual([`${COMMIT}:a.ts`, `${COMMIT}:b.ts`])
})

test('sem gramática, texto simples, com os números de linha', async () => {
  server.use(
    source([{ path: '.gitignore', bytes: 2 }]),
    http.get(`${SOURCE}/file`, () => HttpResponse.json({ text: 'node_modules\ndist\n' })),
  )
  open()
  const lines = await screen.findAllByText(
    (_, element) => element?.getAttribute('data-slot') === 'code-block-line-content',
  )
  expect(lines.map((one) => one.textContent)).toEqual(['node_modules\n', 'dist\n'])
  expect(lines.every((one) => one.querySelector('[class]') === null)).toBe(true)
})

test('acima do teto, texto simples, sem chamar o Shiki', async () => {
  server.use(
    source([{ path: 'grande.ts', bytes: 300_000 }]),
    http.get(`${SOURCE}/file`, () =>
      HttpResponse.json({ text: `const a = 1\n// ${'x'.repeat(262_144)}` }),
    ),
  )
  open()
  await screen.findByRole('region', { name: 'Conteúdo de grande.ts' })
  expect(document.querySelector('[class*="text-code-"]')).toBeNull()
})

/** The highlighter on its own, with a fresh module so no earlier test has made the Shiki yet. */
async function freshHighlighter() {
  vi.resetModules()
  const created = vi.fn()
  vi.doMock('shiki/core', async (original) => {
    const real = await original<typeof import('shiki/core')>()
    return {
      ...real,
      createHighlighterCore: (...args: Parameters<typeof real.createHighlighterCore>) => {
        created()
        return real.createHighlighterCore(...args)
      },
    }
  })
  return { created, ...(await import('./highlight.ts')) }
}

test('acima do teto ou sem gramática, o Shiki nem é chamado', async () => {
  const { created, highlighted } = await freshHighlighter()
  expect(await highlighted('.gitignore', 'dist\n')).toBeNull()
  expect(await highlighted('grande.tsx', `// ${'x'.repeat(262_144)}`)).toBeNull()
  expect(created).not.toHaveBeenCalled()
  expect(await highlighted('a.tsx', 'const a = 1')).not.toBeNull()
  expect(created).toHaveBeenCalledOnce()
})

test('uma gramática que falha ao carregar deixa o arquivo em texto simples, sem erro', async () => {
  const { highlighted } = await freshHighlighter()
  vi.doMock('shiki/langs/sql.mjs', () => {
    throw new Error('the chunk did not load')
  })
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  expect(await highlighted('consulta.sql', 'select 1')).toBeNull()
  expect(warn).toHaveBeenCalledOnce()
  expect(await highlighted('a.tsx', 'const a = 1')).not.toBeNull()
})

test('um arquivo que não é texto: a frase da recusa, e os outros seguem', async () => {
  server.use(
    source([{ path: 'logo.png', bytes: 9 }]),
    http.get(`${SOURCE}/file`, () => refusal('SOURCE_FILE_NOT_TEXT')),
  )
  open()
  expect(await screen.findByText(/Não dá para mostrar este arquivo aqui/)).toBeTruthy()
  expect(screen.getByRole('treeitem', { name: 'logo.png' })).toBeTruthy()
})

test('um arquivo grande demais tem a frase da recusa única, e o caminho longo quebra em vez de ser cortado', async () => {
  const long = 'relatorio-de-encomendas-do-mes-de-outubro-da-padaria-sol-versao-final-revisada.ts'
  server.use(
    source([{ path: long, bytes: 1_200_000 }]),
    http.get(`${SOURCE}/file`, () => refusal('SOURCE_FILE_NOT_TEXT')),
  )
  open()
  expect(await screen.findByText(/Não dá para mostrar este arquivo aqui/)).toBeTruthy()
  const row = screen.getByRole('treeitem', { name: long })
  expect(row.className).toContain('break-all')
  expect(row.className).not.toContain('truncate')
  expect(row.className).toContain('bg-accent-soft')
})

test('a leitura que falha: a frase e "Tentar de novo", que lê outra vez', async () => {
  let calls = 0
  server.use(
    http.get(SOURCE, () => {
      calls += 1
      return calls === 1
        ? refusal('DATABASE_UNAVAILABLE')
        : HttpResponse.json({
            version: 0,
            commit: null,
            savedAt: null,
            files: [],
          })
    }),
  )
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }))
  await waitFor(() => expect(screen.getByText(/Nenhuma versão guardada ainda/)).toBeTruthy())
})

test('a árvore: só o caminho do arquivo aberto, as outras pastas fechadas, e abre pelo teclado', async () => {
  server.use(
    source([
      { path: 'package.json', bytes: 2 },
      { path: 'src/router.tsx', bytes: 2 },
      { path: 'src/components/ui/button.tsx', bytes: 2 },
      { path: 'src/pages/encomendas.tsx', bytes: 2 },
    ]),
    http.get(`${SOURCE}/file`, ({ request }) =>
      HttpResponse.json({ text: `texto de ${new URL(request.url).searchParams.get('path')}` }),
    ),
  )
  open()
  const tree = await screen.findByRole('tree', { name: 'Arquivos do app' })
  const names = within(tree)
    .getAllByRole('treeitem')
    .map((item) => item.textContent)
  expect(names).toEqual([
    'src',
    'components',
    'pages',
    'encomendas.tsx',
    'router.tsx',
    'package.json',
  ])
  expect(screen.getByRole('treeitem', { name: 'src' }).getAttribute('aria-expanded')).toBe('true')
  expect(screen.getByRole('treeitem', { name: 'pages' }).getAttribute('aria-expanded')).toBe('true')
  expect(screen.getByRole('treeitem', { name: 'components' }).getAttribute('aria-expanded')).toBe(
    'false',
  )
  expect(await screen.findByText(/texto de src\/pages\/encomendas\.tsx/)).toBeTruthy()
  const components = screen.getByRole('treeitem', { name: 'components' })
  components.focus()
  fireEvent.keyDown(components, { key: 'ArrowRight' })
  const ui = await screen.findByRole('treeitem', { name: 'ui' })
  ui.focus()
  fireEvent.keyDown(ui, { key: 'ArrowRight' })
  expect(await screen.findByRole('treeitem', { name: 'button.tsx' })).toBeTruthy()
  fireEvent.keyDown(ui, { key: 'ArrowDown' })
  expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: 'button.tsx' }))
  fireEvent.keyDown(ui, { key: 'ArrowLeft' })
})

test('o primeiro arquivo aberto é do app, nunca da memória do Builder em .conexus', async () => {
  server.use(
    source([
      { path: '.conexus/memory/MEMORY.md', bytes: 2 },
      { path: 'package.json', bytes: 2 },
      { path: 'src/pages/encomendas.tsx', bytes: 2 },
    ]),
    http.get(`${SOURCE}/file`, ({ request }) =>
      HttpResponse.json({ text: `texto de ${new URL(request.url).searchParams.get('path')}` }),
    ),
  )
  open()
  expect(await screen.findByText(/texto de src\/pages\/encomendas\.tsx/)).toBeTruthy()
  expect(screen.queryByText(/texto de \.conexus/)).toBeNull()
})

test('o primeiro arquivo aberto não é uma peça do kit: com a árvore do starter, abre src/routes/home.tsx', async () => {
  const starter = resolve(process.cwd(), '../../packages/app/starter')
  const { aliases } = JSON.parse(readFileSync(resolve(starter, 'components.json'), 'utf8'))
  const kit = [aliases.ui, aliases.hooks, aliases.lib].map((alias: string) =>
    alias.replace('@/', 'src/'),
  )
  const files = readdirSync(resolve(starter, 'src'), { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(starter, resolve(entry.parentPath, entry.name)))
  expect(kit.every((folder) => files.some((file) => file.startsWith(`${folder}/`)))).toBe(true)
  server.use(
    source([{ path: 'package.json', bytes: 2 }, ...files.map((path) => ({ path, bytes: 2 }))]),
    http.get(`${SOURCE}/file`, ({ request }) =>
      HttpResponse.json({ text: `texto de ${new URL(request.url).searchParams.get('path')}` }),
    ),
  )
  open()
  expect(await screen.findByText(/texto de src\/routes\/home\.tsx/)).toBeTruthy()
})

test('um app sem arquivos: o vazio', async () => {
  server.use(source([]))
  open()
  expect(await screen.findByText('Este app ainda está vazio')).toBeTruthy()
})

test('no celular, [Arquivos] abre o Sheet e escolher um arquivo o fecha', async () => {
  const phone = vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: true,
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
  try {
    server.use(
      source([
        { path: 'a.ts', bytes: 2 },
        { path: 'b.ts', bytes: 2 },
      ]),
      http.get(`${SOURCE}/file`, ({ request }) =>
        HttpResponse.json({ text: `texto de ${new URL(request.url).searchParams.get('path')}` }),
      ),
    )
    open()
    expect(await screen.findByText(line(/texto de a\.ts/))).toBeTruthy()
    expect(screen.queryByRole('tree')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Arquivos' }))
    fireEvent.click(await screen.findByRole('treeitem', { name: 'b.ts' }))
    expect(await screen.findByText(line(/texto de b\.ts/))).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('tree')).toBeNull())
  } finally {
    phone.mockRestore()
  }
})
