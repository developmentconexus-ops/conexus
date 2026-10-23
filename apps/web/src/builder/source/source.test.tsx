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
  expect(await screen.findByRole('region', { name: 'Conteúdo de a.ts' })).toBeTruthy()
  expect(screen.getByText(/texto de a\.ts/)).toBeTruthy()
  const second = screen.getByRole('treeitem', { name: 'b.ts' })
  second.focus()
  fireEvent.click(second)
  expect(await screen.findByText(/texto de b\.ts/)).toBeTruthy()
  expect(second.getAttribute('aria-selected')).toBe('true')
  expect(requested).toEqual([`${COMMIT}:a.ts`, `${COMMIT}:b.ts`])
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

test('a árvore: pastas do app abertas antes dos arquivos, components/ui fechada, e abre pelo teclado', async () => {
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
    'ui',
    'pages',
    'encomendas.tsx',
    'router.tsx',
    'package.json',
  ])
  expect(screen.getByRole('treeitem', { name: 'ui' }).getAttribute('aria-expanded')).toBe('false')
  expect(screen.getByRole('treeitem', { name: 'src' }).getAttribute('aria-expanded')).toBe('true')
  expect(await screen.findByText(/texto de src\/pages\/encomendas\.tsx/)).toBeTruthy()
  const ui = screen.getByRole('treeitem', { name: 'ui' })
  ui.focus()
  fireEvent.keyDown(ui, { key: 'ArrowRight' })
  expect(await screen.findByRole('treeitem', { name: 'button.tsx' })).toBeTruthy()
  fireEvent.keyDown(ui, { key: 'ArrowDown' })
  expect(document.activeElement).toBe(screen.getByRole('treeitem', { name: 'button.tsx' }))
  fireEvent.keyDown(ui, { key: 'ArrowLeft' })
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
    expect(await screen.findByText(/texto de a\.ts/)).toBeTruthy()
    expect(screen.queryByRole('tree')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Arquivos' }))
    fireEvent.click(await screen.findByRole('treeitem', { name: 'b.ts' }))
    expect(await screen.findByText(/texto de b\.ts/)).toBeTruthy()
    await waitFor(() => expect(screen.queryByRole('tree')).toBeNull())
  } finally {
    phone.mockRestore()
  }
})
