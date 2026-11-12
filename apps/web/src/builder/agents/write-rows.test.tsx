import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { recordedRun } from '../conversation/test-recorded.ts'
import { conversation, reshaped, rowOf } from './test-approval.tsx'

// The row of a tool of the agent in its conversation (step 24.5, U6, criterion 45): a write says it
// wrote, never that it consulted, and a failure opens on words, never on the JSON the model read.
// The stored calls are the ones of `approval` and `approval-refused` (`npm run record`), as a write in
// Faz sozinho keeps them: with no `approval` on the call, so the screen draws a line, not a card.
const server = hubServer()
const REFUSAL = 'Ocorreu algum erro inesperado! O produto [11] enviado não existe.'
const WRITE_FAILED = 'Não conseguiu escrever no Sankhya: Lançar pedido'
const READ_FAILED = 'Não conseguiu consultar Vendas de ontem por vendedor.'

/** What the system threw, as the agents' tools throw it: the JSON of the failure. */
function thrown(fields: object): string {
  return JSON.stringify({
    kind: 'REFUSED',
    status: 400,
    code: null,
    message: null,
    body: null,
    ...fields,
  })
}

/** The calls of a recording as a tool that ran alone leaves them, optionally as another tool and with another failure text. */
function alone(scenario: string, as: { tool?: string; errorText?: string } = {}) {
  return reshaped(recordedRun(scenario).read, (key, value) => {
    if (key === 'approval') return undefined
    if (key === 'toolName' && as.tool !== undefined) return as.tool
    if (key === 'errorText' && as.errorText !== undefined) return as.errorText
    return value
  })
}

test('a linha de uma escrita diz que escreveu no sistema, nunca que consultou, e não diz "Aprovado"', async () => {
  conversation(server, { rows: alone('approval') })
  expect(await screen.findByText('Escreveu no Sankhya: Lançar pedido')).toBeTruthy()
  expect(screen.queryByText(/Consultou/)).toBeNull()
  expect(screen.queryByText('Aprovado por você')).toBeNull()
})

test('o detalhe não mostra o JSON: a escrita que o sistema recusou diz que não conseguiu escrever, e aberta, o rótulo e a mensagem do registro, nunca o JSON nem o texto do modelo', async () => {
  conversation(server, {
    rows: alone('approval-refused', {
      errorText: thrown({ message: 'uma frase que o modelo leu' }),
    }),
    writes: [rowOf('approval-refused', { state: 'REFUSED', approved: false, message: REFUSAL })],
  })
  // The line opens once the record's read has come: before it, a failed write has nothing to add.
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(WRITE_FAILED) }))
  expect(await screen.findByText('O Sankhya não aceitou. Nada foi lançado.')).toBeTruthy()
  expect(screen.getByText(REFUSAL)).toBeTruthy()
  expect(screen.queryByText(/"kind"|frase que o modelo leu/)).toBeNull()
  expect(screen.queryByText(/Não conseguiu consultar/)).toBeNull()
})

test('a escrita que falhou sem linha no registro não abre no JSON', async () => {
  conversation(server, {
    rows: alone('approval-refused', { errorText: thrown({ kind: 'NOT_FIXED', status: null }) }),
  })
  expect(await screen.findByText(WRITE_FAILED)).toBeTruthy()
  await waitFor(() => expect(screen.queryByText(/"kind"/)).toBeNull())
  expect(screen.queryByRole('button', { name: /Não conseguiu escrever/ })).toBeNull()
})

test('a leitura que lançou pede ligar de novo quando o kind é AUTH_REFUSED ou TOKEN_EXPIRED', async () => {
  const errorText = thrown({ kind: 'TOKEN_EXPIRED', status: 401 })
  conversation(server, {
    rows: alone('approval-refused', { tool: 'tool_vendas_de_ontem', errorText }),
  })
  fireEvent.click(await screen.findByText(READ_FAILED))
  expect(await screen.findByRole('link', { name: 'Abrir Integrações' })).toBeTruthy()
  expect(screen.queryByText(/"kind"/)).toBeNull()
})

test('a leitura que lançou por outro motivo diz que o Sankhya não aceitou, e aberta, a mensagem dele, nunca o JSON', async () => {
  const errorText = thrown({ status: 500, message: 'Campo inválido: dataInicial' })
  conversation(server, {
    rows: alone('approval-refused', { tool: 'tool_vendas_de_ontem', errorText }),
  })
  fireEvent.click(await screen.findByText(READ_FAILED))
  expect(await screen.findByText('O Sankhya não aceitou.')).toBeTruthy()
  expect(screen.getByText('Campo inválido: dataInicial')).toBeTruthy()
  expect(screen.queryByText(/"kind"/)).toBeNull()
  expect(screen.queryByRole('link', { name: 'Abrir Integrações' })).toBeNull()
})
