import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { copy, detailOf, openCopies, VENDAS } from './test-hub.tsx'

// A tabela, aba Quem lê: os papéis que leem a tabela, as pessoas de cada um e como leem (Dados, parte 4).
const server = hubServer()
const DETAIL = detailOf(VENDAS)
const READERS = `${DETAIL}?tab=readers`
const READ = {
  copyId: VENDAS,
  roles: [
    { role: 'owner', label: 'Dono', members: 1 },
    { role: 'admin', label: 'Administrador', members: 1 },
    { role: 'financeiro', label: 'Financeiro', members: 2 },
  ],
}

function rowTexts() {
  return within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map((row) => row.textContent)
}

test('a aba Quem lê lista Dono, Administrador e Financeiro com as pessoas (critério 75)', async () => {
  openCopies(server, { copies: [copy()], readers: [READ] }, READERS)
  expect(await screen.findByRole('tab', { name: 'Quem lê 3' })).toBeTruthy()
  await screen.findByRole('table')
  expect(rowTexts().map((row) => row?.replace('Abrir em Papéis', ''))).toEqual([
    'Dono1sempre',
    'Administrador1sempre',
    'Financeiro2marcado em Papéis',
  ])
  expect(
    screen.getByText(
      'Quem lê esta tabela pela conversa e pelos agentes. Para mudar, abra o papel.',
    ),
  ).toBeTruthy()
})

test('Abrir em Papéis aparece para o dono e não para o desenvolvedor (critério 76)', async () => {
  openCopies(server, { copies: [copy()], readers: [READ] }, READERS, 'owner')
  const link = await screen.findByRole('link', { name: 'Abrir em Papéis' })
  expect(link.getAttribute('href')).toBe(`/companies/${COMPANY.id}/settings/roles?role=financeiro`)
  expect(screen.getAllByRole('link', { name: 'Abrir em Papéis' })).toHaveLength(1)
})

test('sem manageRoles: nem o link nem a frase Para mudar (critério 76)', async () => {
  openCopies(server, { copies: [copy()], readers: [READ] }, READERS, 'developer')
  await screen.findByRole('table')
  expect(screen.queryByRole('link', { name: 'Abrir em Papéis' })).toBeNull()
  expect(screen.getByText('Quem lê esta tabela pela conversa e pelos agentes.')).toBeTruthy()
})

test('a leitura de quem lê falhou: a frase do Hub, Tentar de novo, o gatilho sem número (critério 77)', async () => {
  let fail = true
  openCopies(server, { copies: [copy()], readers: [READ] }, READERS)
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/copy-readers`, () =>
      fail ? refusal('COPY_DATABASE_UNAVAILABLE') : undefined,
    ),
  )
  expect(await screen.findByText(/O banco da empresa não respondeu/)).toBeTruthy()
  expect(screen.getByRole('tab', { name: 'Quem lê' })).toBeTruthy()
  fireEvent.click(screen.getByRole('tab', { name: 'Visão geral' }))
  expect(await screen.findByRole('heading', { name: 'vendas' })).toBeTruthy()
  fireEvent.click(screen.getByRole('tab', { name: 'Quem lê' }))
  fail = false
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('tab', { name: 'Quem lê 3' })).toBeTruthy()
})

test('a aba Quem lê fica no endereço (critério 78)', async () => {
  openCopies(server, { copies: [copy()], readers: [READ] }, READERS)
  const tab = await screen.findByRole('tab', { name: 'Quem lê 3' })
  expect(tab.getAttribute('aria-selected')).toBe('true')
  fireEvent.click(screen.getByRole('tab', { name: 'Rodadas' }))
  await waitFor(() =>
    expect(screen.getByRole('tab', { name: 'Rodadas' }).getAttribute('aria-selected')).toBe('true'),
  )
  expect(screen.getByRole('tab', { name: 'Quem lê 3' }).getAttribute('aria-selected')).toBe('false')
})

test('o membro na página da tabela não vê Rodar agora nem o menu (critério 72)', async () => {
  for (const role of ['member', 'developer', 'owner']) {
    openCopies(server, { copies: [copy()], runs: [] }, DETAIL, role)
    const tabs = await screen.findAllByRole('tab')
    expect(tabs.map((one) => one.textContent)).toEqual([
      'Visão geral',
      'Colunas 0',
      'Amostra',
      'Rodadas',
      'Quem lê 2',
    ])
    const builds = role !== 'member'
    expect(screen.queryByRole('button', { name: /Rodar agora/ }) !== null).toBe(builds)
    expect(screen.queryByRole('button', { name: /^Ações:/ }) !== null).toBe(builds)
    cleanup()
  }
})
