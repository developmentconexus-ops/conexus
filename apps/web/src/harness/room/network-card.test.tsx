import { CompanyId, MACHINE_TOOL } from '@conexus/hub-api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
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

function show(item: NetworkCardItem, role = 'owner', ok = true) {
  const answers: [string, unknown][] = []
  function answer(toolCallId: string, resumeData: unknown) {
    answers.push([toolCallId, resumeData])
    return Promise.resolve({ ok })
  }
  server.use(
    ...(role === 'unread'
      ? [http.get(`*/api/companies/${COMPANY.id}`, () => refusal('DATABASE_UNAVAILABLE'))]
      : companyRead({ role })),
  )
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

for (const role of ['owner', 'admin']) {
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

test('sem ler o papel, os botões são os da suspensão e o Hub decide', async () => {
  const answers = show(cardOf(CALL, { ...ASKED, scopes: ['CONVERSATION'] }), 'unread')
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

test('a chamada que o Mastra negou (Parar, um reinício) fecha como Recusado', async () => {
  show(cardOf({ ...CALL, state: 'output-denied' }))
  expect((await card()).getByText('Recusado.')).toBeTruthy()
})

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
