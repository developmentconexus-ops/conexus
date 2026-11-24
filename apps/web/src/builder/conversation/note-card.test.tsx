import { BUILDER_TOOL, CompanyId } from '@conexus/hub-api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { NoteSaveCard } from './note-card.tsx'
import type { NoteCardItem } from './note-parse.ts'
import type { Room } from './room.ts'
import { AnswerProvider, ASSISTANT_ROOM, BUILDER_ROOM, RoomContext } from './room.ts'
import { invocationToItem } from './rows.ts'

const server = hubServer()

const ARGS = {
  connection: 'Matriz',
  concept: 'Empresa',
  mapping: 'TSIEMP.CODEMP é o código da empresa',
  provingQuery: 'SELECT COUNT(*) AS N FROM TSIEMP',
}

function card(over: Partial<NoteCardItem> = {}): NoteCardItem {
  return {
    kind: 'card',
    cardKind: 'note',
    id: 'toolu_1',
    toolCallId: 'toolu_1',
    toolName: BUILDER_TOOL.connectorNoteSave,
    state: 'open',
    asked: ARGS,
    ...over,
  }
}

const ANAS: Room = { ...ASSISTANT_ROOM, notebook: { companyId: CompanyId.parse(COMPANY.id) } }

function show(item: NoteCardItem, room: Room = ANAS) {
  const answers: [string, unknown][] = []
  function answer(toolCallId: string, resumeData: unknown) {
    answers.push([toolCallId, resumeData])
    return Promise.resolve({ ok: true })
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <RoomContext.Provider value={room}>
        <AnswerProvider value={answer}>
          <NoteSaveCard part={item} />
        </AnswerProvider>
      </RoomContext.Provider>
    </QueryClientProvider>,
  )
  return answers
}

function company(mayManage: boolean) {
  server.use(
    http.get('*/api/companies/:companyId/connections', () =>
      HttpResponse.json({ connectors: [], connections: [], mayManage }),
    ),
  )
}

test('o Caderno: "Gravar no Caderno?" lista o conceito, o mapeamento e a consulta, e Aprovar responde o sim à chamada suspensa', async () => {
  company(true)
  const answers = show(card())
  const region = within(await screen.findByRole('region', { name: 'Gravar no Caderno?' }))
  expect(region.getByRole('heading').textContent).toBe('Gravar no Caderno? · Matriz')
  expect(region.getByText('Conceito').nextSibling?.textContent).toBe('Empresa')
  expect(region.getByText('Mapeamento').nextSibling?.textContent).toBe(ARGS.mapping)
  expect(region.getByText('Consulta da prova').nextSibling?.textContent).toBe(ARGS.provingQuery)
  await waitFor(() =>
    expect(region.getByRole('button', { name: 'Aprovar' }).hasAttribute('disabled')).toBe(false),
  )
  fireEvent.click(region.getByRole('button', { name: 'Aprovar' }))
  await waitFor(() => expect(answers).toEqual([['toolu_1', { approved: true }]]))
})

test('o Caderno: quem não gerencia ligações vê o cartão sem os botões e a frase que o manda a quem gerencia', async () => {
  company(false)
  show(card())
  const region = within(await screen.findByRole('region', { name: 'Gravar no Caderno?' }))
  expect(await region.findByText('Peça a quem gerencia a ligação.')).toBeTruthy()
  expect(region.queryByRole('button', { name: 'Aprovar' })).toBeNull()
  expect(region.queryByRole('button', { name: 'Recusar' })).toBeNull()
})

test('o Caderno: no Builder, sem empresa para perguntar, os botões valem e o Hub decide', async () => {
  show(card(), BUILDER_ROOM)
  const region = within(await screen.findByRole('region', { name: 'Gravar no Caderno?' }))
  expect(region.getByRole('button', { name: 'Recusar' }).hasAttribute('disabled')).toBe(false)
})

test('o Caderno: o cartão recusado diz "Não gravado."', async () => {
  company(true)
  show(card({ state: 'declined' }))
  expect(await screen.findByText('Não gravado.')).toBeTruthy()
})

test('o Caderno: a ligação que saiu antes do sim diz "Esta ligação não existe mais. Nada foi gravado."', async () => {
  company(true)
  show(card({ state: 'refused' }))
  expect(await screen.findByText('Esta ligação não existe mais. Nada foi gravado.')).toBeTruthy()
})

test('o Caderno: o sim recusado a quem não gerencia manda a frase a quem gerencia', async () => {
  company(false)
  show(card({ state: 'refused' }))
  expect(await screen.findAllByText('Peça a quem gerencia a ligação.')).toBeTruthy()
})

test('o Caderno: gravado fecha o cartão com "Aprovado por você" e sem alerta', async () => {
  company(true)
  show(card({ state: 'saved' }))
  expect(await screen.findByText('Aprovado por você')).toBeTruthy()
  expect(screen.queryByRole('alert')).toBeNull()
})

test('a chamada do Caderno vira cartão enquanto espera o sim, e cada resultado a fecha como o Caderno disse', () => {
  const call = {
    state: 'call',
    toolCallId: 'toolu_1',
    toolName: BUILDER_TOOL.connectorNoteSave,
    args: ARGS,
  } as const
  const parked = {
    toolCallId: 'toolu_1',
    toolName: call.toolName,
    args: ARGS,
    suspendPayload: ARGS,
  }
  expect(invocationToItem(call, parked)).toMatchObject({
    cardKind: 'note',
    state: 'open',
    asked: ARGS,
  })
  expect(invocationToItem(call, undefined)).toMatchObject({ kind: 'tool' })
  function ended(result: unknown) {
    return invocationToItem({ ...call, state: 'result', result }, undefined)
  }
  expect(ended({ kind: 'SAVED', provedRows: 1 })).toMatchObject({
    cardKind: 'note',
    state: 'saved',
  })
  expect(ended({ kind: 'NOT_SAVED' })).toMatchObject({ cardKind: 'note', state: 'declined' })
  expect(ended({ kind: 'NOT_GRANTED' })).toMatchObject({ cardKind: 'note', state: 'refused' })
  expect(ended({ kind: 'CALLS_SPENT' })).toMatchObject({ kind: 'tool' })
})
