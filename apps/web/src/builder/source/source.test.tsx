import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test } from 'vitest'
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
  expect(await screen.findByText(/Nenhuma versão guardada ainda\. Peça um app na Conversa\./)).toBeTruthy()
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
  const first = await screen.findByRole('button', { name: 'a.ts' })
  expect(first.getAttribute('aria-current')).toBe('true')
  expect(await screen.findByRole('region', { name: 'Conteúdo de a.ts' })).toBeTruthy()
  expect(screen.getByText(/texto de a\.ts/)).toBeTruthy()
  const second = screen.getByRole('button', { name: 'b.ts' })
  second.focus()
  fireEvent.click(second)
  expect(await screen.findByText(/texto de b\.ts/)).toBeTruthy()
  expect(second.getAttribute('aria-current')).toBe('true')
  expect(requested).toEqual([`${COMMIT}:a.ts`, `${COMMIT}:b.ts`])
})

test('um arquivo que não é texto: a frase da recusa, e os outros seguem', async () => {
  server.use(
    source([{ path: 'logo.png', bytes: 9 }]),
    http.get(`${SOURCE}/file`, () => refusal('SOURCE_FILE_NOT_TEXT')),
  )
  open()
  expect(await screen.findByText(/Não dá para mostrar este arquivo aqui/)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'logo.png' })).toBeTruthy()
})

test('um arquivo grande demais diz que é grande, e o caminho longo quebra em vez de ser cortado', async () => {
  const long = `src/${'pasta/'.repeat(12)}relatorio-de-encomendas.ts`
  server.use(
    source([{ path: long, bytes: 1_200_000 }]),
    http.get(`${SOURCE}/file`, () => refusal('SOURCE_FILE_TOO_LARGE')),
  )
  open()
  expect(await screen.findByText(/grande demais para mostrar/)).toBeTruthy()
  const row = screen.getByRole('button', { name: long })
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
