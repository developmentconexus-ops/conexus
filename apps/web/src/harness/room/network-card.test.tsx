import { CompanyId, MACHINE_TOOL } from '@conexus/hub-api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { delay, HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { companyRead, hubServer, refusal } from '../../platform/test-hub.tsx'
import { NetworkAccessCard } from './network-card.tsx'
import type { NetworkCardItem } from './network-parse.ts'
import { AnswerProvider, RoomContext } from './room.ts'
import { invocationToItem } from './rows.ts'
import { conversationOf, FIRST, say, screens } from './test-hub.tsx'
import { recordedRun } from './test-recorded.ts'
import { assistantRoomOf } from './test-rooms.ts'

const server = hubServer()
const { openConversation } = screens(server)

const TITLE = 'O Conexus quer acessar a internet'
const ASKED = {
  domains: ['loja.exemplo.com.br', '*.cdn.exemplo.com'],
  reason: 'ler os produtos e os preços da página inicial',
}
const EVERY_SCOPE = { ...ASKED, scopes: ['CONVERSATION', 'COMPANY'] }
const LOCKED =
  'Só quem constrói ou administra libera um domínio. Peça ao dono ou a um administrador que libere em Configurações, Internet.'
const STEER = 'Uma mensagem nova espera a sua resposta neste cartão.'

const CALL = {
  state: 'call',
  toolCallId: 'toolu_net_1',
  toolName: MACHINE_TOOL.requestNetwork,
  args: ASKED,
} as const

function waitingOn(suspendPayload: unknown) {
  return { toolCallId: CALL.toolCallId, toolName: CALL.toolName, args: ASKED, suspendPayload }
}

function cardOf(
  call: Parameters<typeof invocationToItem>[0],
  suspendPayload?: unknown,
): NetworkCardItem {
  const item = invocationToItem(
    call,
    suspendPayload === undefined ? undefined : waitingOn(suspendPayload),
  )
  if (item?.kind !== 'card' || item.cardKind !== 'network') throw new Error('not the card')
  return item
}

type CompanyAnswer = 'owner' | 'admin' | 'developer' | 'member' | 'read-fails' | 'read-pending'

function companyHandlers(answer: CompanyAnswer) {
  const company = `*/api/companies/${COMPANY.id}`
  if (answer === 'read-fails') return [http.get(company, () => refusal('DATABASE_UNAVAILABLE'))]
  if (answer !== 'read-pending') return companyRead({ role: answer })
  return [http.get(company, () => delay('infinite').then(() => HttpResponse.json({})))]
}

function show(item: NetworkCardItem, company: CompanyAnswer = 'owner', ok = true) {
  const answers: [string, unknown][] = []
  function answer(toolCallId: string, resumeData: unknown) {
    answers.push([toolCallId, resumeData])
    return Promise.resolve({ ok })
  }
  server.use(...companyHandlers(company))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const room = assistantRoomOf({ network: { companyId: CompanyId.parse(COMPANY.id) } })
  render(
    <QueryClientProvider client={client}>
      <RoomContext.Provider value={room}>
        <AnswerProvider value={answer}>
          <NetworkAccessCard part={item} />
        </AnswerProvider>
      </RoomContext.Provider>
    </QueryClientProvider>,
  )
  return answers
}

async function card() {
  return within(await screen.findByRole('region', { name: TITLE }))
}

function buttonsOf(region: Awaited<ReturnType<typeof card>>) {
  return region.queryAllByRole('button').map((button) => button.textContent)
}

async function lit(region: Awaited<ReturnType<typeof card>>, name: string) {
  const button = region.getByRole('button', { name })
  await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false))
  return button
}

test('o cartão aberto diz cada domínio, a estrela em palavras, o motivo e que uma mensagem nova espera (20)', async () => {
  show(cardOf(CALL, EVERY_SCOPE))
  const region = await card()
  const domains = region.getByText('Domínios').nextSibling?.childNodes
  expect([...(domains ?? [])].map((line) => line.textContent)).toEqual([
    'loja.exemplo.com.br',
    'qualquer endereço que termina em .cdn.exemplo.com, menos o próprio cdn.exemplo.com',
  ])
  expect(region.getByText('Motivo').nextSibling?.textContent).toBe(ASKED.reason)
  expect(screen.getByText(STEER)).toBeTruthy()
})

for (const role of ['owner', 'admin'] as const) {
  test(`quem é ${role} vê os três botões, a empresa antes da conversa (20)`, async () => {
    show(cardOf(CALL, EVERY_SCOPE), role)
    const region = await card()
    await lit(region, 'Recusar')
    expect(buttonsOf(region)).toEqual([
      'Liberar para a empresa',
      'Liberar nesta conversa',
      'Recusar',
    ])
  })
}

test('um domínio pedido duas vezes aparece numa linha só (20)', async () => {
  const twice = ['loja.exemplo.com.br', 'Loja.Exemplo.com.br']
  show(cardOf(CALL, { ...EVERY_SCOPE, domains: twice }))
  const domains = (await card()).getByText('Domínios').nextSibling?.childNodes
  expect([...(domains ?? [])].map((line) => line.textContent)).toEqual(['loja.exemplo.com.br'])
})

test('o desenvolvedor vê só Liberar nesta conversa e Recusar, e o sim responde a conversa (20)', async () => {
  const answers = show(cardOf(CALL, { ...ASKED, scopes: ['CONVERSATION'] }), 'developer')
  const region = await card()
  const yes = await lit(region, 'Liberar nesta conversa')
  expect(buttonsOf(region)).toEqual(['Liberar nesta conversa', 'Recusar'])
  fireEvent.click(yes)
  await waitFor(() => expect(answers).toEqual([[CALL.toolCallId, { scope: 'CONVERSATION' }]]))
})

test('o papel lido agora tira o botão que a suspensão ainda oferecia (20)', async () => {
  show(cardOf(CALL, EVERY_SCOPE), 'developer')
  const region = await card()
  await waitFor(() => expect(buttonsOf(region)).toEqual(['Liberar nesta conversa', 'Recusar']))
})

test('um dono não vê a empresa quando a suspensão não a oferece (20)', async () => {
  show(cardOf(CALL, { ...ASKED, scopes: ['CONVERSATION'] }), 'owner')
  const region = await card()
  await lit(region, 'Recusar')
  expect(buttonsOf(region)).toEqual(['Liberar nesta conversa', 'Recusar'])
})

for (const [name, scope, sending] of [
  ['Liberar para a empresa', 'COMPANY', 'Liberando…'],
  ['Liberar nesta conversa', 'CONVERSATION', 'Liberando…'],
  ['Recusar', 'REFUSED', 'Recusando…'],
] as const) {
  test(`${name} responde ${scope} e diz ${sending} no botão tocado, com os outros apagados (20)`, async () => {
    const answers = show(cardOf(CALL, EVERY_SCOPE))
    const region = await card()
    const tapped = await lit(region, name)
    fireEvent.click(tapped)
    await waitFor(() => expect(answers).toEqual([[CALL.toolCallId, { scope }]]))
    expect(tapped.textContent).toBe(sending)
    for (const button of region.getAllByRole('button'))
      expect(button.hasAttribute('disabled')).toBe(true)
  })
}

test('o envio que o Hub não segura mais diz a frase embaixo e devolve os botões', async () => {
  show(cardOf(CALL, EVERY_SCOPE), 'owner', false)
  const region = await card()
  fireEvent.click(await lit(region, 'Liberar nesta conversa'))
  expect(await region.findByText('Não foi possível enviar. Tente de novo.')).toBeTruthy()
  await lit(region, 'Liberar nesta conversa')
})

test('enquanto o papel é lido, os botões da suspensão ficam apagados', async () => {
  show(cardOf(CALL, EVERY_SCOPE), 'read-pending')
  const region = await card()
  const buttons = region.getAllByRole('button')
  expect(buttons.map((button) => button.hasAttribute('disabled'))).toEqual([true, true, true])
})

test('sem ler o papel, os botões são os da suspensão e o Hub decide', async () => {
  const answers = show(cardOf(CALL, { ...ASKED, scopes: ['CONVERSATION'] }), 'read-fails')
  const region = await card()
  fireEvent.click(await lit(region, 'Liberar nesta conversa'))
  await waitFor(() => expect(answers).toHaveLength(1))
})

test('para quem não libera, a frase fica no lugar dos botões, sem a linha da mensagem nova (21)', async () => {
  show(cardOf(CALL, EVERY_SCOPE), 'member')
  const region = await card()
  expect(await region.findByText(LOCKED)).toBeTruthy()
  expect(buttonsOf(region)).toEqual([])
  expect(screen.queryByText(STEER)).toBeNull()
})

test('o pedido recusado por papel aparece com o mesmo aviso (21)', async () => {
  show(
    cardOf({
      ...CALL,
      state: 'result',
      result: { kind: 'NOT_OPEN', domains: ASKED.domains, reason: 'ROLE' },
    }),
    'member',
  )
  const region = await card()
  expect(region.getByText(LOCKED)).toBeTruthy()
  expect(buttonsOf(region)).toEqual([])
})

for (const [result, said] of [
  [{ kind: 'OPEN', scope: 'CONVERSATION' }, 'Liberado nesta conversa.'],
  [{ kind: 'OPEN', scope: 'COMPANY' }, 'Liberado para a empresa.'],
  [{ kind: 'REFUSED' }, 'Recusado.'],
  [
    { kind: 'NOT_OPEN', reason: 'MACHINE_UNAVAILABLE' },
    'Liberado, mas a máquina não respondeu; a próxima tentativa aplica.',
  ],
  [
    { kind: 'NOT_OPEN', reason: 'DATABASE' },
    'Não foi possível conferir a lista agora. Peça de novo daqui a pouco.',
  ],
  [
    { kind: 'NOT_OPEN', reason: 'AUTOMATION' },
    'Numa automação ninguém libera na hora. O dono ou um administrador libera em Configurações, Internet.',
  ],
] as const) {
  test(`o cartão fechado diz "${said}", sem botões (20)`, async () => {
    show(cardOf({ ...CALL, state: 'result', result: { ...result, domains: ASKED.domains } }))
    const region = await card()
    expect(region.getByText(said)).toBeTruthy()
    expect(region.getByText('Motivo').nextSibling?.textContent).toBe(ASKED.reason)
    expect(buttonsOf(region)).toEqual([])
    expect(screen.queryByText(STEER)).toBeNull()
  })
}

// The part Mastra saves for a parked call on Parar (`settleSuspendedToolCallsAsDenied`).
const STOP = { id: CALL.toolCallId, approved: false, reason: 'Aborted by the user' } as const

for (const [by, closed] of [
  ['que o Parar fechou', { ...CALL, state: 'output-denied', approval: STOP }],
  ['negada sem motivo', { ...CALL, state: 'output-denied' }],
] as const) {
  test(`a chamada ${by} fecha como Recusado, sem botões`, async () => {
    show(cardOf(closed))
    const region = await card()
    expect(region.getByText('Recusado.')).toBeTruthy()
    expect(buttonsOf(region)).toEqual([])
    expect(screen.queryByText(STEER)).toBeNull()
  })
}

test('o domínio já aberto e a chamada que falhou ficam na linha da ferramenta', () => {
  const already = { kind: 'OPEN', domains: ASKED.domains, scope: 'ALREADY' }
  expect(invocationToItem({ ...CALL, state: 'result', result: already }, undefined)).toMatchObject({
    kind: 'tool',
  })
  expect(
    invocationToItem({ ...CALL, state: 'output-error', errorText: 'resumeData' }, undefined),
  ).toMatchObject({ kind: 'tool' })
  expect(invocationToItem(CALL, undefined)).toMatchObject({ kind: 'tool' })
})

test('na conversa, a corrida gravada do Mastra abre o cartão, e o resultado sem os argumentos mantém o pedido', async () => {
  const { events } = recordedRun('network')
  const resumed = events.findLastIndex((event) => event.type === 'agent_start')
  const opened = await openConversation(conversationOf({ id: FIRST }))
  say(opened.field, 'Leia os preços')
  const line = opened.line()
  for (const event of events.slice(0, resumed)) line.emit(event)
  await screen.findByRole('region', { name: TITLE })
  for (const event of events.slice(resumed)) line.emit(event)
  expect(await screen.findByText('Liberado nesta conversa.')).toBeTruthy()
  const region = await card()
  expect(region.getByText('Motivo').nextSibling?.textContent).toBe('ler os preços')
})
