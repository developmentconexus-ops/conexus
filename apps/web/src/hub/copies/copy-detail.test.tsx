import { fireEvent, screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connection, copy, copyRun, detailOf, openCopies, VENDAS } from './test-hub.tsx'
import { CATALOG, ORDERS_SHOWN } from './test-sources.ts'

// Uma cópia: o que é copiado e as rodadas (Capacidade 2, criterion 34).
const server = hubServer()
const DETAIL = detailOf(VENDAS)
const RUNS = `${DETAIL}?tab=runs`
const OTHER = '99999999-9999-4999-8999-999999999999'

test('as rodadas: cada uma em palavras, na aba Rodadas', async () => {
  openCopies(
    server,
    {
      copies: [copy()],
      runs: [
        copyRun({ outcome: { kind: 'RUNNING' }, endedAt: null, read: 500, written: 500 }),
        copyRun({
          outcome: { kind: 'ERROR', code: 'COPY_SOURCE_UNREACHABLE' },
          read: 500,
          written: 500,
        }),
        copyRun({ outcome: { kind: 'PARTIAL', reason: 'CAP' } }),
        copyRun({ outcome: { kind: 'INTERRUPTED' } }),
        copyRun(),
      ],
    },
    RUNS,
  )
  expect(await screen.findByRole('heading', { name: 'vendas' })).toBeTruthy()
  expect(screen.getByText('Em dia')).toBeTruthy()
  expect(screen.getByText(/^Copiada do Sankhya em .+ · 118\.402 linhas$/)).toBeTruthy()
  const table = within(screen.getByRole('table'))
  expect(table.getByText('Completa')).toBeTruthy()
  expect(table.getByText('O sistema não respondeu.')).toBeTruthy()
  expect(table.getByText('Parcial; a próxima continua')).toBeTruthy()
  expect(
    table.getByText('O Conexus reiniciou no meio; a próxima continua de onde parou'),
  ).toBeTruthy()
  expect(table.getAllByText('1.204')).toHaveLength(6)
})

test('a cópia e as rodadas: sem rodada, a frase de primeira vez; Rodar agora e o caminho para Dados estão à mão', async () => {
  openCopies(server, { copies: [copy({ run: null })], runs: [] }, RUNS)
  expect(await screen.findByText('A primeira rodada ainda não terminou.')).toBeTruthy()
  expect(within(screen.getByRole('main')).getByRole('link', { name: 'Dados' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Ações: Vendas' })).toBeTruthy()
})

test('o caminho leva a Dados', async () => {
  openCopies(server, { copies: [copy()], runs: [] }, DETAIL)
  const path = within(await screen.findByRole('navigation', { name: 'Caminho' }))
  expect(path.getByRole('link', { name: 'Dados' })).toBeTruthy()
  expect(path.getByRole('link', { name: 'Sankhya' })).toBeTruthy()
  expect(path.getByText('vendas')).toBeTruthy()
  expect(screen.queryByRole('link', { name: /← Dados/ })).toBeNull()
  expect(screen.queryByText(/a cada 30 min/)).toBeNull()
})

test('o caminho', async () => {
  openCopies(server, { copies: [copy()], runs: [] }, DETAIL)
  const path = within(await screen.findByRole('navigation', { name: 'Caminho' }))
  expect(path.getAllByRole('link')).toHaveLength(2)
  for (const link of path.getAllByRole('link')) expect(link.getAttribute('aria-current')).toBeNull()
  fireEvent.click(path.getByRole('link', { name: 'Sankhya' }))
  expect(await screen.findByRole('heading', { name: 'Dados' })).toBeTruthy()
})

test('o caminho leva a busca', async () => {
  openCopies(server, { copies: [copy()], runs: [] }, `${DETAIL}?q=NUNOTA`)
  const path = within(await screen.findByRole('navigation', { name: 'Caminho' }))
  for (const link of path.getAllByRole('link')) {
    const href = link.getAttribute('href') ?? ''
    expect(href).toContain('q=NUNOTA')
    expect(href).not.toContain('layer')
  }
})

const COPIED = /^Copiada do Sankhya em .+ · 118\.402 linhas$/

test('a linha da cópia: a hora do fim da rodada e as linhas', async () => {
  openCopies(server, { copies: [copy()], runs: [] }, DETAIL)
  expect((await screen.findByText(COPIED)).textContent).toMatch(COPIED)
})

test('a linha da cópia: uma rodada parcial também copiou', async () => {
  const run = copyRun({ outcome: { kind: 'PARTIAL', reason: 'CAP' } })
  openCopies(server, { copies: [copy({ run })], runs: [] }, DETAIL)
  expect(await screen.findByText(COPIED)).toBeTruthy()
})

test.each([
  ['a rodada aberta', copyRun({ outcome: { kind: 'RUNNING' }, endedAt: null })],
  ['o erro', copyRun({ outcome: { kind: 'ERROR', code: 'COPY_SOURCE_UNREACHABLE' } })],
  ['a rodada interrompida', copyRun({ outcome: { kind: 'INTERRUPTED' } })],
])('a linha da cópia sem hora quando a rodada não copiou: %s', async (_name, run) => {
  openCopies(server, { copies: [copy({ run })], runs: [] }, DETAIL)
  expect(await screen.findByText('Sankhya · 118.402 linhas')).toBeTruthy()
  expect(screen.queryByText(/Copiada/)).toBeNull()
})

test('a linha da cópia sem rodada e sem linhas', async () => {
  openCopies(server, { copies: [copy({ run: null })], runs: [] }, DETAIL)
  expect(await screen.findByText('Sankhya · a primeira rodada ainda não terminou')).toBeTruthy()
})

test('a linha da cópia sem linhas', async () => {
  openCopies(server, { copies: [copy({ rows: null })], runs: [] }, DETAIL)
  expect(await screen.findByText('Sankhya')).toBeTruthy()
})

test('a cópia e as rodadas: uma cópia que não existe mostra não encontrado', async () => {
  openCopies(server, { copies: [copy()] }, detailOf(OTHER))
  expect(await screen.findByText('Não encontramos o que você procurou.')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Voltar ao início' })).toBeTruthy()
})

test('a cópia e as rodadas: um id que o contrato nunca daria é não encontrado', async () => {
  openCopies(server, { copies: [copy()] }, detailOf('nao-e-um-id'))
  expect(await screen.findByText('Não encontramos o que você procurou.')).toBeTruthy()
})

const INACTIVE_SHOWN = {
  ...copy().shown,
  description: 'As notas de venda',
  columns: [
    { name: 'NUNOTA', type: 'bigint', description: 'O número da nota', inactiveSince: null },
    { name: 'VLRNOTA', type: 'numeric', description: null, inactiveSince: null },
    {
      name: 'OBS',
      type: 'text',
      description: 'A observação',
      inactiveSince: '2026-11-10T08:00:00.000Z',
    },
  ],
}

test('a aba Colunas tem tipo, chave e descrição', async () => {
  openCopies(
    server,
    { copies: [copy({ shown: INACTIVE_SHOWN })], runs: [] },
    `${DETAIL}?tab=columns`,
  )
  expect(await screen.findByRole('heading', { name: 'vendas' })).toBeTruthy()
  const table = within(await screen.findByRole('table'))
  expect(table.getByText('O número da nota')).toBeTruthy()
  expect(table.getByText('Número')).toBeTruthy()
  expect(table.getByText('Valor')).toBeTruthy()
  expect(table.getByText('Chave')).toBeTruthy()
})

test('a tabela abre na Visão geral', async () => {
  openCopies(server, { copies: [copy({ shown: INACTIVE_SHOWN })], runs: [] }, DETAIL)
  expect(await screen.findByRole('heading', { name: 'vendas' })).toBeTruthy()
  const tab = await screen.findByRole('tab', { name: 'Visão geral' })
  expect(tab.getAttribute('aria-selected')).toBe('true')
  const panel = within(screen.getByRole('tabpanel'))
  for (const text of ['As notas de venda', 'Ligação', 'Matriz', 'Chave', 'NUNOTA', 'Modo']) {
    expect(panel.getByText(text)).toBeTruthy()
  }
  expect(panel.queryByText('Leitura de origem')).toBeNull()
})

test('a Visão geral de uma leitura da versão 2 diz a leitura de origem', async () => {
  openCopies(server, { copies: [copy({ shown: ORDERS_SHOWN })], runs: [] }, DETAIL)
  const panel = within(await screen.findByRole('tabpanel'))
  expect(await panel.findByText('Leitura de origem')).toBeTruthy()
  expect(panel.getByText('Pedidos')).toBeTruthy()
})

test('sem descrição, a frase de vazio', async () => {
  openCopies(server, { copies: [copy()], runs: [] }, DETAIL)
  expect(
    await within(await screen.findByRole('tabpanel')).findByText('Sem descrição.'),
  ).toBeTruthy()
})

test('as abas na ordem, com a contagem de colunas', async () => {
  openCopies(server, { copies: [copy({ shown: INACTIVE_SHOWN })], runs: [] }, DETAIL)
  const tabs = await screen.findAllByRole('tab')
  expect(tabs.map((one) => one.textContent)).toEqual([
    'Visão geral',
    'Colunas 3',
    'Amostra',
    'Rodadas',
  ])
})

test('a aba Colunas de uma cópia da versão 1', async () => {
  const columns = [{ name: 'CODPARC', type: 'text', description: null, inactiveSince: null }]
  openCopies(
    server,
    { copies: [copy({ shown: { ...copy().shown, columns } })], runs: [] },
    `${DETAIL}?tab=columns`,
  )
  expect(await screen.findByText('CODPARC')).toBeTruthy()
  expect(screen.getByText('Texto')).toBeTruthy()
})

test('a coluna inativa: o aviso no topo e a marca na coluna', async () => {
  openCopies(server, { copies: [copy({ shown: INACTIVE_SHOWN })], runs: [] }, DETAIL)
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O Sankhya parou de enviar a coluna OBS desde 10/11. Ela fica aqui, inativa, e nada foi apagado.',
  )
  expect(screen.queryByText('Inativa desde 10/11')).toBeNull()
  fireEvent.click(screen.getByRole('tab', { name: /Colunas/ }))
  expect(await screen.findByText('Inativa desde 10/11')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Ver a rodada' })).toBeTruthy()
})

test('a coluna inativa: com duas, o aviso fala no plural', async () => {
  const columns = INACTIVE_SHOWN.columns.map((column) => ({
    ...column,
    inactiveSince: column.name === 'VLRNOTA' ? '2026-11-12T08:00:00.000Z' : column.inactiveSince,
  }))
  openCopies(
    server,
    { copies: [copy({ shown: { ...INACTIVE_SHOWN, columns } })], runs: [] },
    DETAIL,
  )
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O Sankhya parou de enviar as colunas VLRNOTA e OBS desde 10/11. Elas ficam aqui, inativas, e nada foi apagado.',
  )
})

test('sem coluna inativa, não há aviso', async () => {
  openCopies(server, { copies: [copy()], runs: [] }, DETAIL)
  await screen.findByRole('heading', { name: 'vendas' })
  expect(screen.queryByRole('alert')).toBeNull()
})

test('a aba fica no endereço', async () => {
  openCopies(server, { copies: [copy()], runs: [copyRun()] }, RUNS)
  expect(await screen.findByText('Completa')).toBeTruthy()
  expect(screen.getByRole('tab', { name: 'Rodadas' }).getAttribute('aria-selected')).toBe('true')
  fireEvent.click(screen.getByRole('tab', { name: /Colunas/ }))
  await within(document.body).findByRole('table')
  expect(screen.queryByText('Completa')).toBeNull()
})

test('a aba desconhecida abre a Visão geral', async () => {
  openCopies(server, { copies: [copy()], runs: [] }, `${DETAIL}?tab=zzz`)
  const tab = await screen.findByRole('tab', { name: 'Visão geral' })
  expect(tab.getAttribute('aria-selected')).toBe('true')
})

test('o endereço antigo leva à tabela', async () => {
  openCopies(
    server,
    { copies: [copy()], runs: [copyRun()] },
    `/companies/${COMPANY.id}/copies/${VENDAS}?tab=runs`,
  )
  expect(await screen.findByText('Completa')).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'vendas' })).toBeTruthy()
})

test('a falha das conexões: a frase e Tentar de novo, e não o id do conector', async () => {
  let fail = true
  openCopies(server, { copies: [copy()], runs: [] }, DETAIL)
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/connections`, () =>
      fail
        ? refusal('DATABASE_UNAVAILABLE')
        : HttpResponse.json({ connectors: CATALOG, connections: [connection()], mayManage: true }),
    ),
  )
  const main = within(await screen.findByRole('main'))
  const retry = await main.findByRole('button', { name: 'Tentar de novo' })
  expect(screen.queryByText(/sankhya/)).toBeNull()
  fail = false
  fireEvent.click(retry)
  expect(await screen.findByText(COPIED)).toBeTruthy()
})
