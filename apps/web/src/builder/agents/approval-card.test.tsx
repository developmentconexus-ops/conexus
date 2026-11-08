import type { WrittenRow } from '@conexus/hub-api'
import { OperationId, ToolCallId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hourOf } from '../../platform/dates.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { say } from '../conversation/test-hub.tsx'
import { recordedRun } from '../conversation/test-recorded.ts'
import { MATRIZ } from './test-agents.ts'
import {
  asks,
  conversation,
  ends,
  holdsApproval,
  lineOf,
  rowOf,
  SESSION,
  tell,
  withArgs,
} from './test-approval.tsx'

// The card **Aprovar?** of a write that asks the person (step 24.5, criteria 14, 15 and 21), fed with
// the events Mastra emitted in the recordings of `npm run record -- approval*`.
const server = hubServer()
const TITLE = /quer lançar pedido no Sankhya/

/** What the record lists now: a test sets it before the call ends, as the funnel writes the row. */
let recorded: WrittenRow[] = []

/** The conversation told up to the moment the session's state holds the call, as a person sees the card appear. */
async function asked(scenario: string) {
  recorded = []
  const opened = conversation(server, {
    writesAnswer: () => HttpResponse.json({ writes: recorded }),
  })
  const line = await lineOf(opened)
  const rest = tell(line, recordedRun(scenario).events, holdsApproval)
  return { opened, line, rest, card: await screen.findByRole('region', { name: TITLE }) }
}

function bodiesOfAnswers() {
  const bodies: unknown[] = []
  server.use(
    http.post(`${SESSION}/tool-approval`, async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json({ ok: true })
    }),
  )
  return bodies
}

test('o cartão mostra o agente, a ação, cada campo, Aprovar e Recusar, e a frase sob a caixa (critério 14)', async () => {
  await asked('approval')
  const card = within(screen.getByRole('region', { name: TITLE }))
  expect(card.getByRole('heading').textContent).toContain('Conferente de metas')
  expect(card.getByRole('heading').textContent).toContain('Matriz')
  expect(card.getByText('Cliente').nextSibling?.textContent).toBe('1')
  expect(card.getByText('2 × produto 11 a R$ 10,00')).toBeTruthy()
  expect(card.getByText('R$ 20,00')).toBeTruthy()
  expect(card.getByRole('button', { name: 'Aprovar' }).hasAttribute('disabled')).toBe(false)
  expect(card.getByRole('button', { name: 'Recusar' }).hasAttribute('disabled')).toBe(false)
  expect(screen.getByText('Escrever outra mensagem recusa este pedido.')).toBeTruthy()
  // The box stays open while the card waits: a message is how the person declines by writing.
  expect(
    screen
      .getByRole('textbox', { name: 'Mensagem para o Conferente de metas' })
      .hasAttribute('disabled'),
  ).toBe(false)
})

test('os botões acendem só quando o estado da sessão traz o toolCallId', async () => {
  const opened = conversation(server)
  const line = await lineOf(opened)
  tell(line, recordedRun('approval').events, (event) => asks(event))
  const card = within(await screen.findByRole('region', { name: TITLE }))
  expect(card.getByRole('button', { name: 'Aprovar' }).hasAttribute('disabled')).toBe(true)
  expect(card.getByRole('button', { name: 'Recusar' }).hasAttribute('disabled')).toBe(true)
  tell(line, recordedRun('approval').events, holdsApproval)
  await waitFor(() =>
    expect(card.getByRole('button', { name: 'Aprovar' }).hasAttribute('disabled')).toBe(false),
  )
})

test('Aprovar manda o toolCallId pela rota nativa; o cartão passa a "Aprovado por você" e diz o número do pedido', async () => {
  const bodies = bodiesOfAnswers()
  const { line, rest, card } = await asked('approval')
  fireEvent.click(within(card).getByRole('button', { name: 'Aprovar' }))
  await waitFor(() => expect(bodies).toHaveLength(1))
  expect(bodies[0]).toMatchObject({ approved: true })
  expect(Reflect.get(Object(bodies[0]), 'toolCallId')).toMatch(/^toolu_/)
  await screen.findByText('Aprovando…')
  recorded = [rowOf('approval')]
  for (const event of rest) line.emit(event)
  expect(await screen.findByText('Aprovado por você')).toBeTruthy()
  expect(screen.getByText('Pedido 98001 lançado, a confirmar.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Aprovar' })).toBeNull()
})

test('Recusar manda approved: false, e o cartão passa a "Recusado"', async () => {
  const bodies = bodiesOfAnswers()
  const { line, rest, card } = await asked('approval-declined')
  fireEvent.click(within(card).getByRole('button', { name: 'Recusar' }))
  await waitFor(() => expect(bodies).toEqual([expect.objectContaining({ approved: false })]))
  for (const event of rest) line.emit(event)
  expect(await screen.findByText('Recusado')).toBeTruthy()
})

test('uma mensagem da pessoa recusa o pedido: "Recusado porque você mandou outra mensagem"', async () => {
  const { line, rest } = await asked('approval-interrupted')
  for (const event of rest) line.emit(event)
  expect(await screen.findByText('Recusado porque você mandou outra mensagem')).toBeTruthy()
})

test('Parar recusa o pedido: "Recusado porque você parou a conversa"', async () => {
  const { line, rest } = await asked('approval-stopped')
  for (const event of rest) line.emit(event)
  expect(await screen.findByText('Recusado porque você parou a conversa')).toBeTruthy()
})

/** The same run, whose write ended as `result`: the end of the call is overlaid, the rest is Mastra's. */
async function endedAs(result: unknown) {
  const { line, rest } = await asked('approval')
  for (const event of rest) {
    line.emit(ends(event) ? { ...event, result } : event)
  }
}

test('um envio sem resposta diz a marca para procurar no Sankhya', async () => {
  await endedAs({
    kind: 'WRITE_UNCERTAIN',
    mark: 'Conexus 7F3A2B1C',
    instruction: 'Do not call this again',
  })
  expect(
    await screen.findByText(
      'Não deu para saber se o pedido foi lançado. Procure no Sankhya a observação Conexus 7F3A2B1C.',
    ),
  ).toBeTruthy()
})

test('UNREACHABLE e DEADLINE antes do envio: "Não conseguiu lançar" com a falha dita', async () => {
  await endedAs({ kind: 'DEADLINE' })
  expect(await screen.findByText('Não conseguiu lançar')).toBeTruthy()
  expect(screen.getByText('O sistema demorou demais para responder.')).toBeTruthy()
})

test('o aviso do pedido igual: com um envio aberto da mesma escrita, a hora e a marca aparecem acima dos botões; sem ele, não (critério 21)', async () => {
  const sentAt = '2026-11-07T13:12:00.000Z'
  const opened = conversation(server, {
    writes: [
      {
        toolCallId: ToolCallId.parse('toolu_open'),
        approved: true,
        message: null,
        connectionId: MATRIZ,
        operation: OperationId.parse('lancarPedido'),
        state: 'UNCERTAIN',
        sentAt,
        mark: 'Conexus 7F3A2B1C',
      },
    ],
  })
  const line = await lineOf(opened)
  tell(line, recordedRun('approval').events, holdsApproval)
  expect(
    await screen.findByText(
      `Um pedido foi enviado às ${hourOf(sentAt)} e não sabemos se entrou. Confira no Sankhya pela marca Conexus 7F3A2B1C antes de aprovar.`,
    ),
  ).toBeTruthy()
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

test('sem envio aberto da mesma escrita, o cartão não traz o aviso', async () => {
  await asked('approval')
  expect(screen.queryByText(/não sabemos se entrou/)).toBeNull()
})

test('ao reabrir, a escrita decidida em outra aba aparece decidida, com o número do pedido (critério 16)', async () => {
  conversation(server, { rows: recordedRun('approval').read, writes: [rowOf('approval')] })
  expect(await screen.findByText('Aprovado por você')).toBeTruthy()
  expect(screen.getByText('Pedido 98001 lançado, a confirmar.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Aprovar' })).toBeNull()
})

test('ao reabrir, a escrita ainda guardada como aberta volta com os botões acesos só quando a sessão a segura', async () => {
  const run = recordedRun('approval-stopped')
  const opened = conversation(server, { rows: run.read })
  const line = await lineOf(opened)
  expect(screen.queryByRole('button', { name: 'Aprovar' })).toBeNull()
  tell(line, run.events, holdsApproval)
  const card = within(await screen.findByRole('region', { name: TITLE }))
  expect(card.getByRole('button', { name: 'Aprovar' }).hasAttribute('disabled')).toBe(false)
})

test('uma escrita que lançou o erro sem linha no registro diz "Não conseguiu lançar" e a falha, sem "Aprovado" nem "Recusado"', async () => {
  const { line, rest, card } = await asked('approval')
  fireEvent.click(within(card).getByRole('button', { name: 'Aprovar' }))
  for (const event of rest) {
    line.emit(
      ends(event)
        ? { ...event, result: 'connect ECONNREFUSED', isError: true, denied: false }
        : event,
    )
  }
  expect(await screen.findByText('Não conseguiu lançar')).toBeTruthy()
  expect(screen.getByText('Deu um erro no Hub e o pedido não foi enviado.')).toBeTruthy()
  await waitFor(() => expect(recorded).toEqual([]))
  expect(screen.queryByText('Aprovado por você')).toBeNull()
  expect(screen.queryByText('Recusado')).toBeNull()
})

test.each([
  [{ kind: 'NOT_IN_ROLE' }, 'Seu papel não pode usar a ferramenta Lançar pedido.'],
  [{ kind: 'NOT_GRANTED' }, 'Esta ligação não está disponível nesta conversa.'],
  [{ kind: 'CALLS_SPENT' }, 'Esta resposta já usou as 50 leituras que cabem em uma resposta.'],
  [
    { kind: 'WRITE_OPEN', mark: 'Conexus 7f3a2b1c', instruction: 'Do not call this again' },
    'Um pedido igual pode já existir, e este não foi enviado.',
  ],
])('a recusa %j diz quem recusou, não "O sistema recusou o pedido."', async (result, said) => {
  await endedAs(result)
  expect(await screen.findByText('Não conseguiu lançar')).toBeTruthy()
  expect(screen.getByText(said)).toBeTruthy()
  expect(screen.queryByText('O sistema recusou o pedido.')).toBeNull()
})

test('a leitura dos envios abertos que falha mostra a falha com Tentar de novo e deixa os botões apagados até ela voltar', async () => {
  let failing = true
  const opened = conversation(server, {
    writesAnswer: () =>
      failing ? refusal('DATABASE_UNAVAILABLE') : HttpResponse.json({ writes: [] }),
  })
  const line = await lineOf(opened)
  tell(line, recordedRun('approval').events, holdsApproval)
  const card = within(await screen.findByRole('region', { name: TITLE }))
  const retry = await screen.findByRole('button', { name: 'Tentar de novo' })
  expect(card.getByRole('button', { name: 'Aprovar' }).hasAttribute('disabled')).toBe(true)
  expect(card.getByRole('button', { name: 'Recusar' }).hasAttribute('disabled')).toBe(true)
  failing = false
  fireEvent.click(retry)
  await waitFor(() =>
    expect(card.getByRole('button', { name: 'Aprovar' }).hasAttribute('disabled')).toBe(false),
  )
  expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
})

test('enquanto a leitura dos envios abertos se refaz, os botões ficam apagados e a resposta velha não aparece', async () => {
  const sentAt = '2026-11-07T13:12:00.000Z'
  const stale = {
    toolCallId: ToolCallId.parse('toolu_open'),
    approved: true,
    message: null,
    connectionId: MATRIZ,
    operation: OperationId.parse('lancarPedido'),
    state: 'UNCERTAIN' as const,
    sentAt,
    mark: 'Conexus 7f3a2b1c',
  }
  let release: () => void = () => undefined
  const gate = new Promise<void>((done) => {
    release = done
  })
  let reads = 0
  const opened = conversation(server, {
    writesAnswer: async () => {
      reads += 1
      if (reads > 1) await gate
      return HttpResponse.json({ writes: [stale] })
    },
  })
  const line = await lineOf(opened)
  tell(line, recordedRun('approval').events, holdsApproval)
  const card = within(await screen.findByRole('region', { name: TITLE }))
  await waitFor(() => expect(reads).toBeGreaterThan(1))
  expect(card.getByRole('button', { name: 'Aprovar' }).hasAttribute('disabled')).toBe(true)
  expect(screen.queryByText(/não sabemos se entrou/)).toBeNull()
  release()
  expect(await screen.findByText(/não sabemos se entrou/)).toBeTruthy()
  await waitFor(() =>
    expect(card.getByRole('button', { name: 'Aprovar' }).hasAttribute('disabled')).toBe(false),
  )
})

test('uma mensagem escrita com o cartão esperando fica na fila da conversa', async () => {
  await asked('approval')
  say(
    await screen.findByRole('textbox', { name: 'Mensagem para o Conferente de metas' }),
    'Mande de novo.',
  )
  expect(await screen.findByText('Vai ao Conferente de metas no próximo passo')).toBeTruthy()
})

test('o cartão mostra o logotipo da ligação (critério 14)', async () => {
  await asked('approval')
  const card = screen.getByRole('region', { name: TITLE })
  expect(card.querySelector('svg, img')).not.toBeNull()
})

test('Aprovar que a Mastra já não espera (ok: false: outra aba respondeu) deixa o cartão dizer o que a sessão diz (critério 16)', async () => {
  server.use(http.post(`${SESSION}/tool-approval`, () => HttpResponse.json({ ok: false })))
  const { line, rest, card } = await asked('approval')
  fireEvent.click(within(card).getByRole('button', { name: 'Aprovar' }))
  await waitFor(() =>
    expect(within(card).getByRole('button', { name: 'Aprovar' }).hasAttribute('disabled')).toBe(
      false,
    ),
  )
  expect(screen.queryByText('Não foi possível enviar. Tente de novo.')).toBeNull()
  for (const event of rest) line.emit(event)
  expect(await screen.findByText('Aprovado por você')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Aprovar' })).toBeNull()
})

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
    expect(await screen.findByText('Aprovado por você')).toBeTruthy()
    expect(screen.getByText(said)).toBeTruthy()
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

test('a recusa ao vivo: o cartão lê a linha do registro quando a chamada termina, não o errorText do modelo', async () => {
  const { line, rest, card } = await asked('approval')
  fireEvent.click(within(card).getByRole('button', { name: 'Aprovar' }))
  recorded = [rowOf('approval', { state: 'REFUSED', message: REFUSAL })]
  const errorText = JSON.stringify({ kind: 'REFUSED', message: 'uma frase que o modelo inventou' })
  for (const event of rest) {
    line.emit(ends(event) ? { ...event, result: errorText, isError: true, denied: false } : event)
  }
  expect(await screen.findByText('O Sankhya não aceitou. Nada foi lançado.')).toBeTruthy()
  expect(screen.getByText(REFUSAL)).toBeTruthy()
  expect(screen.getByText('Aprovado por você')).toBeTruthy()
  expect(screen.queryByText(/inventou/)).toBeNull()
  expect(screen.queryByRole('button', { name: 'Aprovar' })).toBeNull()
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
