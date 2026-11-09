import type { WrittenRow } from '@conexus/hub-api'
import { OperationId, ToolCallId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { recordedRun } from '../conversation/test-recorded.ts'
import { MATRIZ } from './test-agents.ts'
import {
  conversation,
  ends,
  holdsApproval,
  lineOf,
  rowOf,
  tell,
  withArgs,
} from './test-approval.tsx'

// The card of a write read from the record, live and after a reload (step 24.5, U6, criteria 40, 41
// and 42), fed with the events Mastra emitted in the recordings of `npm run record -- approval*`.
const server = hubServer()
const TITLE = /quer lançar pedido no Sankhya/

/** The call asked, the person answered and the call ended with the model's own error text; the record lists `recorded`. */
async function approvedLive(recorded: WrittenRow[], errorText: string) {
  const opened = conversation(server, {
    writesAnswer: () => HttpResponse.json({ writes: recorded }),
  })
  const line = await lineOf(opened)
  const rest = tell(line, recordedRun('approval').events, holdsApproval)
  const card = await screen.findByRole('region', { name: TITLE })
  fireEvent.click(within(card).getByRole('button', { name: 'Aprovar' }))
  for (const event of rest) {
    line.emit(ends(event) ? { ...event, result: errorText, isError: true, denied: false } : event)
  }
}

const REFUSAL = 'Ocorreu algum erro inesperado! O produto [999] enviado não existe.'

test.each([
  ['lançada', rowOf('approval'), 'Pedido 98001 lançado, a confirmar.'],
  [
    'recusada pelo sistema',
    rowOf('approval', { state: 'REFUSED', message: REFUSAL }),
    'O Sankhya não aceitou. Nada foi lançado.',
  ],
  [
    'sem resposta',
    rowOf('approval', { state: 'UNCERTAIN' }),
    'Não deu para saber se o pedido foi lançado. Procure no Sankhya a observação Conexus 7F3A2B1C.',
  ],
])(
  'depois de recarregar, o desfecho vem do registro: %s diz "Aprovado por você" e o desfecho da linha',
  async (_, row, said) => {
    conversation(server, { rows: recordedRun('approval').read, writes: [row] })
    expect(await screen.findByText(said)).toBeTruthy()
    expect(screen.getByText('Aprovado por você')).toBeTruthy()
    if (row.state === 'REFUSED') {
      expect(screen.getByText(REFUSAL)).toBeTruthy()
      expect(screen.queryByText('Não conseguiu lançar')).toBeNull()
      expect(screen.queryByText(/lançado, a confirmar/)).toBeNull()
    }
  },
)

test('depois de recarregar, uma escrita que ninguém aprovou no registro não diz "Aprovado", e uma sem linha também não', async () => {
  conversation(server, {
    rows: recordedRun('approval').read,
    writes: [rowOf('approval', { approved: false })],
  })
  expect(await screen.findByText('Pedido 98001 lançado, a confirmar.')).toBeTruthy()
  expect(screen.queryByText('Aprovado por você')).toBeNull()
})

test('depois de recarregar, a escrita sem linha no registro mostra o que o Mastra guardou, sem "Aprovado"', async () => {
  conversation(server, { rows: recordedRun('approval').read })
  expect(await screen.findByText('Pedido 98001 lançado, a confirmar.')).toBeTruthy()
  await waitFor(() => expect(screen.queryByText('Aprovado por você')).toBeNull())
})

test('a recusa ao vivo: o cartão lê a linha do registro quando a chamada termina, não o errorText que o Mastra deu ao modelo', async () => {
  const recorded: WrittenRow[] = []
  const opened = conversation(server, {
    writesAnswer: () => HttpResponse.json({ writes: recorded }),
  })
  const line = await lineOf(opened)
  const events = recordedRun('approval-refused').events
  const rest = tell(line, events, holdsApproval)
  const card = await screen.findByRole('region', { name: TITLE })
  fireEvent.click(within(card).getByRole('button', { name: 'Aprovar' }))
  for (const event of rest) {
    // The record has the row only once the call ended: the card reads it again then.
    if (ends(event))
      recorded.push(rowOf('approval-refused', { state: 'REFUSED', message: REFUSAL }))
    line.emit(event)
  }
  expect(await screen.findByText('O Sankhya não aceitou. Nada foi lançado.')).toBeTruthy()
  expect(screen.getByText(REFUSAL)).toBeTruthy()
  expect(screen.getByText('Aprovado por você')).toBeTruthy()
  expect(screen.queryByText(/"kind"/)).toBeNull()
  expect(screen.queryByRole('button', { name: 'Aprovar' })).toBeNull()
})

test('depois de recarregar, a recusa gravada vem do registro, com o texto que o Mastra guardou ao lado', async () => {
  conversation(server, {
    rows: recordedRun('approval-refused').read,
    writes: [rowOf('approval-refused', { state: 'REFUSED', message: REFUSAL })],
  })
  expect(await screen.findByText('O Sankhya não aceitou. Nada foi lançado.')).toBeTruthy()
  expect(screen.getByText('Aprovado por você')).toBeTruthy()
  expect(screen.getByText(REFUSAL)).toBeTruthy()
  expect(screen.queryByText(/"kind"/)).toBeNull()
})

test('o pedido com a nota modelo e os locais: a nota vem dos valores fixos da versão, e cada item traz local e lote', async () => {
  const order = {
    codigoCliente: 1,
    itens: [
      {
        codigoProduto: 8,
        quantidade: 2,
        valorUnitario: 10,
        codigoLocalEstoque: 3,
        controle: 'L-9',
      },
      { codigoProduto: 9, quantidade: 1, valorUnitario: 5, codigoLocalEstoque: 4 },
    ],
  }
  conversation(server, {
    rows: withArgs(recordedRun('approval').read, order),
    bound: { notaModelo: 12 },
    writes: [rowOf('approval')],
  })
  const card = within(await screen.findByRole('region', { name: TITLE }))
  expect(card.getByText('Nota modelo').nextSibling?.textContent).toBe('12')
  expect(card.getByText('Cliente').nextSibling?.textContent).toBe('1')
  expect(card.getByText('2 × produto 8 a R$ 10,00 · local 3 · lote L-9')).toBeTruthy()
  expect(card.getByText('1 × produto 9 a R$ 5,00 · local 4')).toBeTruthy()
  expect(card.getByText('R$ 25,00')).toBeTruthy()
  expect(card.getByText('Data e hora').nextSibling?.textContent).toBe('as do envio')
})

test('o local fixado na versão vale para todo item e vence o de cada um, e a nota modelo do modelo não vence a fixa', async () => {
  const order = {
    notaModelo: 99,
    codigoCliente: 1,
    itens: [{ codigoProduto: 8, quantidade: 2, valorUnitario: 10, codigoLocalEstoque: 3 }],
  }
  conversation(server, {
    rows: withArgs(recordedRun('approval').read, order),
    bound: { notaModelo: 12, codigoLocalEstoque: 7 },
    writes: [rowOf('approval')],
  })
  const card = within(await screen.findByRole('region', { name: TITLE }))
  expect(card.getByText('Nota modelo').nextSibling?.textContent).toBe('12')
  expect(card.getByText('2 × produto 8 a R$ 10,00 · local 7')).toBeTruthy()
})

test('numa conversa publicada cujo rascunho mudou depois, o cartão não mostra os valores fixos do rascunho', async () => {
  const order = {
    codigoCliente: 1,
    itens: [{ codigoProduto: 8, quantidade: 2, valorUnitario: 10, codigoLocalEstoque: 3 }],
  }
  conversation(server, {
    rows: withArgs(recordedRun('approval').read, order),
    bound: { notaModelo: 12, codigoLocalEstoque: 7 },
    state: { kind: 'PUBLISHED', version: 1, changed: true },
    writes: [rowOf('approval')],
  })
  const card = within(await screen.findByRole('region', { name: TITLE }))
  expect(card.getByText('Cliente').nextSibling?.textContent).toBe('1')
  expect(card.queryByText('Nota modelo')).toBeNull()
  expect(card.getByText('2 × produto 8 a R$ 10,00 · local 3')).toBeTruthy()
})

test('o aviso do pedido igual não vem de uma escrita que terminou: DONE e REFUSED do registro não avisam', async () => {
  const done = {
    toolCallId: ToolCallId.parse('toolu_done'),
    approved: true,
    message: null,
    connectionId: MATRIZ,
    operation: OperationId.parse('lancarPedido'),
    sentAt: '2026-11-07T13:12:00.000Z',
    mark: 'Conexus 7F3A2B1C',
  }
  const opened = conversation(server, {
    writes: [
      { ...done, state: 'DONE' },
      { ...done, toolCallId: ToolCallId.parse('toolu_refused'), state: 'REFUSED', message: 'x' },
    ],
  })
  const line = await lineOf(opened)
  tell(line, recordedRun('approval').events, holdsApproval)
  const card = within(await screen.findByRole('region', { name: TITLE }))
  await waitFor(() =>
    expect(card.getByRole('button', { name: 'Aprovar' }).hasAttribute('disabled')).toBe(false),
  )
  expect(screen.queryByText(/não sabemos se entrou/)).toBeNull()
})

test('uma escrita que lançou o erro sem linha no registro diz "Não conseguiu lançar" e a falha, sem "Aprovado" nem "Recusado"', async () => {
  await approvedLive([], 'connect ECONNREFUSED')
  expect(await screen.findByText('Não conseguiu lançar')).toBeTruthy()
  expect(screen.getByText('Deu um erro no Hub e o pedido não foi enviado.')).toBeTruthy()
  expect(screen.queryByText('Aprovado por você')).toBeNull()
  expect(screen.queryByText('Recusado')).toBeNull()
})

test('o item cujo controle é um espaço, o "sem controle" do Sankhya, não mostra lote', async () => {
  const order = {
    codigoCliente: 1,
    itens: [
      { codigoProduto: 8, quantidade: 2, valorUnitario: 10, codigoLocalEstoque: 3, controle: ' ' },
    ],
  }
  conversation(server, {
    rows: withArgs(recordedRun('approval').read, order),
    bound: { notaModelo: 12 },
    writes: [rowOf('approval')],
  })
  const card = within(await screen.findByRole('region', { name: TITLE }))
  expect(card.getByText('2 × produto 8 a R$ 10,00 · local 3')).toBeTruthy()
  expect(card.queryByText(/lote/)).toBeNull()
})
