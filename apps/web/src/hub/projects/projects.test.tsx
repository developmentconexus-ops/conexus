import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
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
const PROJECTS = `/companies/${COMPANY.id}/projects`

function hub(projects: (typeof PEDIDOS)[]) {
  server.use(...projectsRead({ projects, databaseReady: true, mayDelete: true, role: 'member' }))
}

function open(path = PROJECTS) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

function main() {
  return within(screen.getByRole('main'))
}

test('vazio: "Nenhum projeto ainda." na página Todos os projetos', async () => {
  hub([])
  open()
  expect(await screen.findByRole('heading', { name: 'Todos os projetos' })).toBeTruthy()
  expect(await screen.findByText('Nenhum projeto ainda.')).toBeTruthy()
})

test('cada cartão: o nome, "Criado em" e o link para o Projeto', async () => {
  hub([PEDIDOS])
  server.use(conversationsNone)
  const router = open()
  await screen.findByRole('heading', { name: 'Todos os projetos' })
  const link = await main().findByRole('link', { name: /Pedidos/ })
  expect(link.textContent).toContain('Criado em 17/10/2026')
  fireEvent.click(link)
  expect(await screen.findByText(/Ainda não há uma prévia disponível/)).toBeTruthy()
  expect(router.state.location.pathname).toBe(`${PROJECTS}/${PEDIDOS.id}`)
})

test('a página fica no endereço: "Ver mais" pede a que segue', async () => {
  const asked: string[] = []
  hub([PEDIDOS])
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects`, ({ request }) => {
      asked.push(new URL(request.url).search)
      return HttpResponse.json({
        projects: [PEDIDOS],
        next: { kind: 'MORE', page: 'c'.repeat(32) },
        databaseReady: true,
      })
    }),
  )
  const router = open()
  fireEvent.click(await screen.findByRole('link', { name: 'Ver mais: Projetos' }))
  expect(await screen.findByRole('link', { name: 'Primeira página: Projetos' })).toBeTruthy()
  expect(router.state.location.search).toEqual({ page: 'c'.repeat(32) })
  expect(asked).toContain(`?page=${'c'.repeat(32)}`)
})

test('o banco indisponível: o aviso do Hub na área, com a barra à esquerda', async () => {
  hub([])
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects`, () => refusal('DATABASE_UNAVAILABLE')),
  )
  open()
  expect((await screen.findByRole('alert')).textContent).toContain(
    'O banco do Conexus não respondeu.',
  )
  expect(screen.getByRole('navigation', { name: 'Navegação' })).toBeTruthy()
})

test('a empresa que o Hub não acha: "não encontrado" no lugar da página', async () => {
  hub([])
  server.use(http.get(`*/api/companies/${COMPANY.id}/projects`, () => refusal('NOT_FOUND')))
  open()
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
})

test('"Projeto apagado." chega uma vez e sai do endereço', async () => {
  hub([PEDIDOS])
  const router = open(`${PROJECTS}?notice=deleted`)
  expect(await screen.findByText('Projeto apagado.')).toBeTruthy()
  await waitFor(() => expect(router.state.location.search).toEqual({}))
  expect(screen.getByText('Projeto apagado.')).toBeTruthy()
})
