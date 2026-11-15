import { CopyId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { CLIENTES, connection, copy, LIST, openCopies, proposal } from './test-hub.tsx'
import { CATALOG, STORES } from './test-sources.ts'

// Dados: the Bruto layer by system, the search, the empty states and the layer in the address (parte 1, 8.1 to 8.14).
const server = hubServer()

const OTHER = CopyId.parse('99999999-9999-4999-8999-999999999999')
const SHOWN = copy().shown
const COLUMN = { type: 'text', description: null, inactiveSince: null } as const

test('Dados: a camada Bruto agrupa por sistema', async () => {
  openCopies(
    server,
    {
      copies: [
        copy(),
        copy({ id: CLIENTES, name: 'clientes', label: 'Clientes' }),
        copy({ id: OTHER, name: 'ml_pedidos', label: 'Pedidos', sources: STORES }),
      ],
    },
    LIST,
  )
  expect(await screen.findByText('Sankhya · Matriz · 2 tabelas')).toBeTruthy()
  expect(screen.getByText('Mercado Livre · Loja A, Loja B · 1 tabela')).toBeTruthy()
})

test('Dados: a linha mostra a descrição, ou o rótulo', async () => {
  openCopies(
    server,
    {
      copies: [
        copy({ shown: { ...SHOWN, description: 'As notas de venda' } }),
        copy({ id: CLIENTES, name: 'clientes', label: 'Clientes' }),
      ],
    },
    LIST,
  )
  expect(await screen.findByText('As notas de venda')).toBeTruthy()
  expect(screen.getByText('Clientes')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'vendas' })).toBeTruthy()
})

function searchable() {
  return [
    copy({
      name: 'sankhya_vendas',
      shown: { ...SHOWN, columns: [{ name: 'NUNOTA', ...COLUMN }] },
    }),
    copy({
      id: CLIENTES,
      name: 'sankhya_clientes',
      label: 'Clientes',
      shown: { ...SHOWN, description: 'Devoluções', columns: [{ name: 'CODPARC', ...COLUMN }] },
    }),
  ]
}

test('Dados: a busca acha pela coluna', async () => {
  openCopies(server, { copies: searchable() }, LIST)
  const main = within(await screen.findByRole('main'))
  const box = await main.findByRole('searchbox', { name: 'Buscar tabela ou coluna' })
  fireEvent.change(box, { target: { value: 'NUNOTA' } })
  await waitFor(() => expect(screen.queryByText('sankhya_clientes')).toBeNull())
  expect(main.getByText('sankhya_vendas')).toBeTruthy()
})

test('Dados: a busca não liga para acento', async () => {
  openCopies(server, { copies: searchable() }, LIST)
  const main = within(await screen.findByRole('main'))
  const box = await main.findByRole('searchbox', { name: 'Buscar tabela ou coluna' })
  fireEvent.change(box, { target: { value: 'devolucoes' } })
  await waitFor(() => expect(screen.queryByText('sankhya_vendas')).toBeNull())
  expect(main.getByText('sankhya_clientes')).toBeTruthy()
})

test('Dados: a busca sem resposta diz que nada bate', async () => {
  openCopies(server, { copies: searchable() }, LIST)
  const main = within(await screen.findByRole('main'))
  const box = await main.findByRole('searchbox', { name: 'Buscar tabela ou coluna' })
  fireEvent.change(box, { target: { value: 'zzz' } })
  expect(await main.findByText('Nenhuma tabela com esse texto.')).toBeTruthy()
})

test('Dados: nenhum sistema ligado', async () => {
  openCopies(server, { copies: [], connections: [] }, LIST)
  const main = within(await screen.findByRole('main'))
  expect(await main.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
  expect(
    screen.getByText(
      'Ligue um sistema da empresa, como o Sankhya, e as tabelas copiadas dele aparecem aqui.',
    ),
  ).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Ligar um sistema' }).getAttribute('href')).toBe(
    `/companies/${COMPANY.id}/integrations`,
  )
})

test('Dados: um sistema sem cópia', async () => {
  openCopies(server, { copies: [], connections: [connection()] }, LIST)
  const main = within(await screen.findByRole('main'))
  expect(await main.findByText('Sankhya · Matriz')).toBeTruthy()
  expect(main.getByText('Nenhuma tabela copiada')).toBeTruthy()
})

test('Dados: a falha de leitura e Tentar de novo', async () => {
  let fail = true
  openCopies(
    server,
    {
      copies: [copy()],
      answers: { list: () => (fail ? refusal('DATABASE_UNAVAILABLE') : undefined) },
    },
    LIST,
  )
  const main = within(await screen.findByRole('main'))
  const retry = await main.findByRole('button', { name: 'Tentar de novo' })
  expect(
    main.getByText(
      'Não deu para ler o catálogo agora. Nada foi apagado. Tente de novo em instantes.',
    ),
  ).toBeTruthy()
  fail = false
  fireEvent.click(retry)
  expect(await main.findByText('Sankhya · Matriz · 1 tabela')).toBeTruthy()
})

test('Dados: a camada Negócio vazia', async () => {
  openCopies(server, { copies: [copy()] }, `${LIST}?layer=business`)
  expect(await screen.findByText('Nenhum conceito aprovado ainda')).toBeTruthy()
  expect(screen.getByRole('tab', { name: /Negócio/ }).getAttribute('aria-selected')).toBe('true')
})

test('Dados: a camada fica no endereço', async () => {
  openCopies(server, { copies: [copy()] }, LIST)
  fireEvent.mouseDown(await screen.findByRole('tab', { name: /Negócio/ }), { button: 0 })
  fireEvent.click(screen.getByRole('tab', { name: /Negócio/ }))
  expect(await screen.findByText('Nenhum conceito aprovado ainda')).toBeTruthy()
  expect(
    within(screen.getByRole('tablist', { name: 'Camada' })).getByRole('tab', { name: /Bruto/ }),
  ).toBeTruthy()
})

test('Cópias leva a Dados', async () => {
  openCopies(server, { copies: [copy()] }, LIST.replace(/\/data$/, '/copies'))
  expect(await screen.findByRole('heading', { name: 'Dados' })).toBeTruthy()
})

test('Dados: uma conexão que não está ativa não vira sistema', async () => {
  const waiting = connection({ state: 'NEEDS_REAUTH' })
  openCopies(server, { copies: [], connections: [waiting] }, LIST)
  const main = within(await screen.findByRole('main'))
  expect(await main.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
  expect(main.queryByText('Nenhuma tabela copiada')).toBeNull()
})

test('Dados: sem sistema ligado, uma proposta aberta ainda aparece e a frase de vazio some', async () => {
  openCopies(server, { copies: [], connections: [], proposals: [proposal()] }, LIST)
  const main = within(await screen.findByRole('main'))
  expect(await main.findByText('Proposta')).toBeTruthy()
  expect(main.queryByText('Nenhum sistema ligado ainda')).toBeNull()
})

test('Dados: a falha da leitura das conexões tem Tentar de novo', async () => {
  let fail = true
  openCopies(server, { copies: [copy()] }, LIST)
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/connections`, () =>
      fail
        ? refusal('DATABASE_UNAVAILABLE')
        : HttpResponse.json({ connectors: CATALOG, connections: [connection()], mayManage: true }),
    ),
  )
  const main = within(await screen.findByRole('main'))
  const retry = await main.findByRole('button', { name: 'Tentar de novo' })
  fail = false
  fireEvent.click(retry)
  expect(await main.findByText('Sankhya · Matriz · 1 tabela')).toBeTruthy()
})
