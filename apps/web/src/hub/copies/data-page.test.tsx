import { CopyId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { CLIENTES, connection, copy, LIST, openCopies } from './test-hub.tsx'

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
        copy({ id: OTHER, name: 'ml_pedidos', label: 'Pedidos', sources: copy().sources }),
      ],
    },
    LIST,
  )
  expect(await screen.findByText('Sankhya · Matriz · 3 tabelas')).toBeTruthy()
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
  const box = await screen.findByRole('searchbox', { name: 'Buscar tabela ou coluna' })
  fireEvent.change(box, { target: { value: 'NUNOTA' } })
  await waitFor(() => expect(screen.queryByText('sankhya_clientes')).toBeNull())
  expect(screen.getByText('sankhya_vendas')).toBeTruthy()
})

test('Dados: a busca não liga para acento', async () => {
  openCopies(server, { copies: searchable() }, LIST)
  const box = await screen.findByRole('searchbox', { name: 'Buscar tabela ou coluna' })
  fireEvent.change(box, { target: { value: 'devolucoes' } })
  await waitFor(() => expect(screen.queryByText('sankhya_vendas')).toBeNull())
  expect(screen.getByText('sankhya_clientes')).toBeTruthy()
})

test('Dados: a busca sem resposta diz que nada bate', async () => {
  openCopies(server, { copies: searchable() }, LIST)
  const box = await screen.findByRole('searchbox', { name: 'Buscar tabela ou coluna' })
  fireEvent.change(box, { target: { value: 'zzz' } })
  expect(await screen.findByText('Nenhuma tabela com esse texto.')).toBeTruthy()
})

test('Dados: nenhum sistema ligado', async () => {
  openCopies(server, { copies: [], connections: [] }, LIST)
  expect(await screen.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
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
  expect(await screen.findByText('Sankhya · Matriz')).toBeTruthy()
  expect(screen.getByText('Nenhuma tabela copiada')).toBeTruthy()
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
  const retry = await screen.findByRole('button', { name: 'Tentar de novo' })
  expect(
    screen.getByText(
      'Não deu para ler o catálogo agora. Nada foi apagado. Tente de novo em instantes.',
    ),
  ).toBeTruthy()
  fail = false
  fireEvent.click(retry)
  expect(await screen.findByText('Sankhya · Matriz · 1 tabela')).toBeTruthy()
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
