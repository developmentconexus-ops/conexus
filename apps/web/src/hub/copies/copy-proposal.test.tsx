import { CopyProposalId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { copy, DEVOLUCOES, LIST, onPhone, openCopies, proposal } from './test-hub.tsx'
import { ORDERS_SHOWN, STORES } from './test-sources.ts'

// Cópias: the Builder's proposals, Ligar and Dispensar (Capacidade 3, criteria 27, 28 and 35).
const server = hubServer()

async function rowOf(name: string): Promise<HTMLElement> {
  const row = (await screen.findByText(name)).closest('tr, li')
  if (!(row instanceof HTMLElement)) throw new Error(`no row for ${name}`)
  return row
}

async function openDialog(row: HTMLElement) {
  fireEvent.click(within(row).getByRole('button', { name: 'Ligar' }))
  return within(await screen.findByRole('dialog'))
}

test('a proposta: ligar e dispensar', async () => {
  const hub = openCopies(server, { copies: [], proposals: [proposal()] }, LIST)
  const row = await rowOf('Devoluções')
  // A proposal and no copy: the list with its row, without the first-time sentence.
  expect(screen.queryByText(/Copie um dado de uma conexão/)).toBeNull()
  expect(within(row).getByText('Proposta')).toBeTruthy()
  expect(within(row).getByText('Matriz')).toBeTruthy()
  expect(within(row).getByText(/devolucoes/)).toBeTruthy()
  expect(within(row).getByText('teste: mais de 50 linhas')).toBeTruthy()
  expect(within(row).getByText('devolucoes · cópia inteira · por Ana Lima')).toBeTruthy()
  expect(within(row).getByText('Vendedores')).toBeTruthy()
  expect(within(row).getByRole('button', { name: 'Dispensar' })).toBeTruthy()
  const dialog = await openDialog(row)
  expect(dialog.getByText('SELECT ID_DEVOLUCAO')).toBeTruthy()
  expect(dialog.getByText('ID_DEVOLUCAO')).toBeTruthy()
  expect(dialog.getByText('Libera ao Projeto Vendedores')).toBeTruthy()
  const ligar = dialog.getByRole('button', { name: 'Ligar' })
  fireEvent.click(ligar)
  fireEvent.click(ligar)
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(hub.writes()).toHaveLength(1)
  expect(hub.writes()[0]?.body).toEqual({
    from: 'PROPOSAL',
    proposalId: DEVOLUCOES,
    interval: '30m',
  })
  expect(hub.writes()[0]?.key).toMatch(/^[0-9a-f-]{36}$/)
  // Turned on, the row becomes the copy, with its Projeto in the Projetos column.
  await waitFor(() => expect(screen.queryByText('Proposta')).toBeNull())
  const made = await rowOf('Devoluções')
  expect(within(made).getByText('Vendedores')).toBeTruthy()
  expect(within(made).getByRole('button', { name: 'Ações: Devoluções' })).toBeTruthy()
})

test('a proposta: dispensar tira a linha; decidida em outra aba, a frase e a lista relida', async () => {
  const other = proposal({
    id: CopyProposalId.parse('77777777-7777-4777-8777-777777777777'),
    name: 'trocas',
    label: 'Trocas',
  })
  const held = { copies: [copy()], proposals: [proposal(), other] }
  const hub = openCopies(server, held, LIST)
  fireEvent.click(within(await rowOf('Trocas')).getByRole('button', { name: 'Dispensar' }))
  await waitFor(() => expect(screen.queryByText('Trocas')).toBeNull())
  expect(hub.writes().map((one) => one.path)).toEqual([
    expect.stringMatching(/\/copy-proposals\/77777777-7777-4777-8777-777777777777\/dismiss$/),
  ])
  // Another tab dismissed Devoluções: the late Ligar answers 409 with the phrase, and the list reads again.
  const row = await rowOf('Devoluções')
  const dialog = await openDialog(row)
  const found = held.proposals.find((one) => one.id === DEVOLUCOES)
  if (found) found.state = 'DISMISSED'
  fireEvent.click(dialog.getByRole('button', { name: 'Ligar' }))
  expect(await screen.findByText(/Esta proposta já foi ligada ou dispensada/)).toBeTruthy()
  expect(screen.queryByRole('dialog')).toBeNull()
  await waitFor(() => expect(screen.queryByText('Devoluções')).toBeNull())
})

test('a proposta: uma recusa que não decide fica no diálogo', async () => {
  let refuse = true
  openCopies(
    server,
    {
      copies: [],
      proposals: [proposal()],
      answers: { decide: () => (refuse ? refusal('NOT_IN_ROLE') : undefined) },
    },
    LIST,
  )
  const dialog = await openDialog(await rowOf('Devoluções'))
  fireEvent.click(dialog.getByRole('button', { name: 'Ligar' }))
  const said = (await dialog.findByRole('alert')).textContent ?? ''
  // The sentence is for turning on a copy, not the one for publishing a tool.
  expect(said).toMatch(/quem liga uma cópia precisa poder ler/)
  expect(said).not.toMatch(/publicar|tire a ferramenta/)
  expect(screen.getByRole('dialog')).toBeTruthy()
  refuse = false
  fireEvent.click(dialog.getByRole('button', { name: 'Ligar' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
})

test('a proposta que sumiu: o diálogo diz isso, sem mandar conferir o endereço', async () => {
  openCopies(
    server,
    { copies: [], proposals: [proposal()], answers: { decide: () => refusal('NOT_FOUND') } },
    LIST,
  )
  const dialog = await openDialog(await rowOf('Devoluções'))
  fireEvent.click(dialog.getByRole('button', { name: 'Ligar' }))
  const said = (await dialog.findByRole('alert')).textContent ?? ''
  expect(said).toMatch(/Esta proposta não existe mais/)
  expect(said).not.toMatch(/endereço/)
})

test('a proposta diz o modo', async () => {
  const week = { column: 'DTNEG', days: 7 }
  const shown = { ...proposal().shown, changedSince: { column: 'DTALTER' }, window: week }
  openCopies(
    server,
    { copies: [], proposals: [proposal({ mode: { kind: 'WINDOW', days: 7 }, shown })] },
    LIST,
  )
  const row = await rowOf('Devoluções')
  expect(within(row).getByText('devolucoes · por janela de 7 dias · por Ana Lima')).toBeTruthy()
  const dialog = await openDialog(row)
  expect(dialog.getByText('por janela de 7 dias')).toBeTruthy()
  fireEvent.click(dialog.getByRole('button', { name: 'Ligar' }))
  // The copy made from the proposal has the mode of its definition.
  const made = await waitFor(async () => {
    expect(screen.queryByText('Proposta')).toBeNull()
    return rowOf('Devoluções')
  })
  expect(within(made).getByText('por janela de 7 dias')).toBeTruthy()
})

test('no celular', async () => {
  await onPhone(async () => {
    openCopies(server, { copies: [copy()], proposals: [proposal()] }, LIST)
    const row = await rowOf('Devoluções')
    expect(row.tagName).toBe('LI')
    expect(within(row).getByText('Proposta')).toBeTruthy()
    expect(within(row).getByText('devolucoes · cópia inteira · por Ana Lima')).toBeTruthy()
    expect(within(row).getByText('teste: mais de 50 linhas · Vendedores')).toBeTruthy()
    expect(within(row).getByRole('button', { name: 'Ligar' })).toBeTruthy()
    expect(within(row).getByRole('button', { name: 'Dispensar' })).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })
})

test('a proposta de uma leitura de lista', async () => {
  const listed = proposal({
    ...{ name: 'ml_pedidos', label: 'Pedidos das lojas', sources: STORES, shown: ORDERS_SHOWN },
    ...{ mode: { kind: 'CHANGES' }, proved: { rows: 50, more: true, calls: 6 } },
  })
  const untold = proposal({
    id: CopyProposalId.parse('88888888-8888-4888-8888-888888888888'),
    ...{ name: 'ml_semtotal', label: 'Sem total', sources: STORES, shown: ORDERS_SHOWN },
    ...{ mode: { kind: 'CHANGES' }, proved: { rows: 3, more: false, calls: null } },
  })
  openCopies(server, { copies: [], proposals: [listed, untold] }, LIST)
  const row = await rowOf('Pedidos das lojas')
  expect(await within(row).findByText('Pedidos · Mercado Livre')).toBeTruthy()
  expect(
    within(row).getByText('Loja A, Loja B · ml_pedidos · só o alterado · por Ana Lima'),
  ).toBeTruthy()
  expect(
    within(row).getByText('teste: mais de 50 linhas · cerca de 6 chamadas por passada'),
  ).toBeTruthy()
  expect(
    within(await rowOf('Sem total')).getByText('teste: 3 linhas · a leitura não informa o total'),
  ).toBeTruthy()
  const dialog = await openDialog(row)
  expect(dialog.queryByText('Consulta')).toBeNull()
  const facts: [string, string][] = [
    ['Leitura', 'Pedidos · Mercado Livre'],
    ['Filtros', 'status: paid'],
    ['Contas', 'Loja A, Loja B'],
  ]
  for (const [label, value] of facts)
    expect(dialog.getByText(value).closest('p')?.textContent).toBe(`${label} ${value}`)
  expect(dialog.getByText('cerca de 6 chamadas por passada')).toBeTruthy()
  expect(dialog.getByText('id')).toBeTruthy()
})
