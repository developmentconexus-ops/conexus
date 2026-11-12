import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { CLIENTES, copy, copyRun, LIST, onPhone, openCopies, PRODUTOS } from './test-hub.tsx'
import { ORDERS_SHOWN, STORES } from './test-sources.ts'

// Cópias: the rail, the list and the actions of a row (Capacidade 2, criteria 30, 31, 33 and 35).
const server = hubServer()

async function rowOf(name: string): Promise<HTMLElement> {
  const row = (await screen.findByText(name)).closest('tr, li')
  if (!(row instanceof HTMLElement)) throw new Error(`no row for ${name}`)
  return row
}

test('Cópias: a faixa mostra a entrada ao dono e ao desenvolvedor', async () => {
  openCopies(server, { copies: [copy()] }, LIST, 'developer')
  expect(await screen.findByRole('heading', { name: 'Cópias' })).toBeTruthy()
  expect(screen.getAllByRole('link', { name: 'Cópias' }).length).toBeGreaterThan(0)
})

test('Cópias: a faixa e quem não vê: o membro não tem a entrada e o endereço dá não encontrado', async () => {
  const hub = openCopies(server, { copies: [copy()] }, LIST, 'member')
  expect(await screen.findByText('Não encontramos o que você procurou.')).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Cópias' })).toBeNull()
  expect(hub.sent.filter((one) => one.path.endsWith('/copies'))).toHaveLength(0)
})

test('Cópias: a lista mostra cada cópia com o estado em palavras e os números em português', async () => {
  openCopies(
    server,
    {
      copies: [
        copy(),
        copy({
          id: CLIENTES,
          name: 'clientes',
          label: 'Clientes',
          run: copyRun({ outcome: { kind: 'RUNNING' }, endedAt: null, read: 10, written: 10 }),
          rows: 9871,
          interval: '1h',
          projects: [],
        }),
      ],
    },
    LIST,
  )
  const vendas = await rowOf('Vendas')
  expect(within(vendas).getByText('Em dia')).toBeTruthy()
  expect(within(vendas).getByText('Matriz')).toBeTruthy()
  expect(within(vendas).getByText('42 s')).toBeTruthy()
  expect(within(vendas).getByText('118.402')).toBeTruthy()
  expect(within(vendas).getByText('30 min')).toBeTruthy()
  expect(within(vendas).getByText('Vendedores')).toBeTruthy()
  const clientes = await rowOf('Clientes')
  expect(within(clientes).getByText('Rodando…')).toBeTruthy()
  expect(within(clientes).getByText('9.871')).toBeTruthy()
  expect(within(clientes).getByText('1 h')).toBeTruthy()
})

test('Cópias: um erro mostra "Com erro" e a frase do código; pausada e sem relógio têm a sua palavra', async () => {
  openCopies(
    server,
    {
      copies: [
        copy({ run: copyRun({ outcome: { kind: 'ERROR', code: 'COPY_SOURCE_UNREACHABLE' } }) }),
        copy({ id: CLIENTES, label: 'Clientes', schedule: { kind: 'PAUSED' } }),
        copy({
          id: PRODUTOS,
          label: 'Produtos',
          schedule: { kind: 'MISSING' },
          interval: null,
        }),
      ],
    },
    LIST,
  )
  const vendas = await rowOf('Vendas')
  expect(within(vendas).getByText('Com erro')).toBeTruthy()
  expect(within(vendas).getByText('O sistema não respondeu.')).toBeTruthy()
  expect(within(await rowOf('Clientes')).getByText('Pausada')).toBeTruthy()
  const produtos = await rowOf('Produtos')
  expect(within(produtos).getByText('Sem relógio')).toBeTruthy()
  expect(within(produtos).queryByText('30 min')).toBeNull()
})

test('a rodada que esperou', async () => {
  openCopies(
    server,
    { copies: [copy({ run: copyRun({ outcome: { kind: 'PARTIAL', reason: 'WAIT' } }) })] },
    LIST,
  )
  const vendas = await rowOf('Vendas')
  expect(
    within(vendas).getByText('Esperando o fornecedor; a próxima rodada continua de onde parou'),
  ).toBeTruthy()
})

test('Cópias: sem cópias, a frase de primeira vez e Ligar uma cópia', async () => {
  openCopies(server, { copies: [] }, LIST)
  expect(
    await screen.findByText(
      'Copie um dado de uma conexão para o banco da empresa e libere aos Projetos que usam.',
    ),
  ).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Ligar uma cópia' })).toBeTruthy()
})

test('Cópias: a falha de leitura mostra a frase e Tentar de novo', async () => {
  openCopies(server, { copies: [], answers: { list: () => refusal('DATABASE_UNAVAILABLE') } }, LIST)
  expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
})

test('Cópias: as ações chamam a rota e a linha mostra o estado novo; uma rodando mostra a frase do código', async () => {
  let refuse = false
  const hub = openCopies(
    server,
    {
      copies: [copy()],
      answers: { write: () => (refuse ? refusal('COPY_RUNNING') : undefined) },
    },
    LIST,
  )
  const row = await rowOf('Vendas')
  fireEvent.click(within(row).getByRole('button', { name: 'Ações: Vendas' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Pausar' }))
  await waitFor(async () => expect(within(await rowOf('Vendas')).getByText('Pausada')).toBeTruthy())
  fireEvent.click(within(await rowOf('Vendas')).getByRole('button', { name: 'Ações: Vendas' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Retomar' }))
  await waitFor(async () => expect(within(await rowOf('Vendas')).getByText('Em dia')).toBeTruthy())
  refuse = true
  fireEvent.click(within(await rowOf('Vendas')).getByRole('button', { name: 'Ações: Vendas' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Rodar agora' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Esta cópia já está rodando. Espere ela terminar.',
  )
  expect(hub.writes().map((one) => one.path.split('/').at(-1))).toEqual(['pause', 'resume', 'run'])
})

test('Cópias: Intervalo muda o intervalo da linha; uma sem relógio não oferece Rodar agora', async () => {
  const hub = openCopies(
    server,
    {
      copies: [
        copy(),
        copy({ id: CLIENTES, label: 'Clientes', schedule: { kind: 'MISSING' }, interval: null }),
      ],
    },
    LIST,
  )
  const row = await rowOf('Vendas')
  fireEvent.click(within(row).getByRole('button', { name: 'Ações: Vendas' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Intervalo' }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.click(within(dialog).getByRole('combobox', { name: 'Intervalo' }))
  const option = await screen.findByRole('option', { name: '6 h' })
  fireEvent.pointerDown(option)
  fireEvent.mouseDown(option)
  fireEvent.pointerUp(option)
  fireEvent.mouseUp(option)
  fireEvent.click(option)
  await waitFor(() =>
    expect(within(dialog).getByRole('combobox', { name: 'Intervalo' }).textContent).toBe('6 h'),
  )
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(hub.writes().map((one) => one.body)).toEqual([{ interval: '6h' }]))
  await waitFor(async () => expect(within(await rowOf('Vendas')).getByText('6 h')).toBeTruthy())
  fireEvent.click(within(await rowOf('Clientes')).getByRole('button', { name: 'Ações: Clientes' }))
  expect(await screen.findByRole('menuitem', { name: 'Retomar' })).toBeTruthy()
  expect(screen.queryByRole('menuitem', { name: 'Rodar agora' })).toBeNull()
})

test('Cópias: no celular, a lista vira linhas que quebram', async () => {
  await onPhone(async () => {
    openCopies(server, { copies: [copy()] }, LIST)
    const row = await rowOf('Vendas')
    expect(row.tagName).toBe('LI')
    expect(within(row).getByText('Em dia')).toBeTruthy()
    expect(within(row).getByText('por janela de 30 dias')).toBeTruthy()
    expect(within(row).getByText('118.402 linhas · 30 min')).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })
})

test('o modo da cópia', async () => {
  const whole = { kind: 'WHOLE' } as const
  const changes = { kind: 'CHANGES' } as const
  openCopies(
    server,
    {
      copies: [
        copy(),
        copy({ id: CLIENTES, name: 'clientes', label: 'Clientes', mode: changes }),
        copy({ id: PRODUTOS, name: 'produtos', label: 'Produtos', mode: whole }),
      ],
    },
    LIST,
  )
  // The words come from `copy.mode`, as the Hub classified it; the screen never reads the definition.
  expect(within(await rowOf('Vendas')).getByText('por janela de 30 dias')).toBeTruthy()
  expect(within(await rowOf('Clientes')).getByText('só o alterado')).toBeTruthy()
  expect(within(await rowOf('Produtos')).getByText('cópia inteira')).toBeTruthy()
})

test('a origem da cópia', async () => {
  const orders = copy({
    ...{ name: 'ml_pedidos', label: 'Pedidos das lojas', sources: STORES },
    ...{ shown: ORDERS_SHOWN, mode: { kind: 'CHANGES' }, interval: null },
  })
  openCopies(server, { copies: [orders], runs: [] }, LIST)
  const row = await rowOf('Pedidos das lojas')
  // The read's label and the connector's name, from the catalog; the accounts before the mode.
  expect(await within(row).findByText('Pedidos · Mercado Livre')).toBeTruthy()
  expect(within(row).getByText('Loja A, Loja B · só o alterado')).toBeTruthy()
  fireEvent.click(within(row).getByRole('link', { name: 'Pedidos das lojas' }))
  const copied = within(await screen.findByRole('region', { name: 'O que é copiado' }))
  expect(copied.getByText('Os pedidos de cada loja')).toBeTruthy()
  expect(copied.getByText('Pedidos · Mercado Livre')).toBeTruthy()
  expect(copied.getByText('status: paid')).toBeTruthy()
  expect(copied.getByText('Loja A, Loja B')).toBeTruthy()
  const columns = within(copied.getByRole('list', { name: 'Colunas' }))
  expect(columns.getByText(/O número do pedido/)).toBeTruthy()
  // A column with no description: its name and type alone.
  const plain = columns.getByText('atualizado').closest('li')
  expect(plain?.textContent).toBe('atualizado timestamp')
})

test('a origem da cópia: no telefone, as contas quebram a linha', async () => {
  const orders = copy({
    ...{ name: 'ml_pedidos', label: 'Pedidos das lojas', sources: STORES },
    ...{ shown: ORDERS_SHOWN, mode: { kind: 'CHANGES' } },
  })
  await onPhone(async () => {
    openCopies(server, { copies: [orders] }, LIST)
    const row = await rowOf('Pedidos das lojas')
    expect(
      await within(row).findByText(' · Pedidos · Mercado Livre', { normalizer: (text) => text }),
    ).toBeTruthy()
    expect(within(row).getByText('Loja A, Loja B · só o alterado').className).toContain(
      'break-words',
    )
  })
})
