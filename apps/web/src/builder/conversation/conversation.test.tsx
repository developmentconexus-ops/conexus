import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT_START, RUNNING, signalStarted, stepStarted, textDelta } from './test-events.ts'
import { choose, conversationOf, FIRST, PROJECT, say, screens, typed, view } from './test-hub.tsx'
import { builderSaid, personSaid } from './test-stream.tsx'

const { open, openConversation } = screens(hubServer())

test('a conversa mostra o modelo, só dos fornecedores com conta, e as mensagens', async () => {
  const { shown } = await openConversation(
    conversationOf({
      id: FIRST,
      title: 'Padarias',
      messages: [personSaid('Oi', 'p1'), builderSaid('Olá, **tudo bem**?')],
    }),
  )
  expect(shown.conversations).toHaveLength(1)
  expect(screen.getByRole('combobox', { name: 'Conversas' })).toHaveProperty('value', 'Padarias')
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  expect(within(log).getByText('Oi')).toBeTruthy()
  expect(within(log).getByText('tudo bem').tagName).toBe('STRONG')
  const picker = screen.getByRole('combobox', { name: 'Modelo e raciocínio' })
  expect(picker.textContent).toContain('Claude Sonnet 4')
  fireEvent.click(picker)
  const models = (await screen.findAllByRole('option')).map((one) => one.textContent)
  expect(models).toEqual(['Claude Sonnet 4', 'Claude Opus 4', 'Gemini 2.5 Pro', 'Gemini 2.5 Flash'])
})

test('o compositor lista os fornecedores conectados da pessoa, também o que o Hub diz sem conta usável agora', async () => {
  await openConversation(
    conversationOf({ id: FIRST }),
    view({ providers: ['anthropic', 'google'], usable: ['anthropic'] }),
  )
  fireEvent.click(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }))
  const models = (await screen.findAllByRole('option')).map((one) => one.textContent)
  expect(models).toEqual(['Claude Sonnet 4', 'Claude Opus 4', 'Gemini 2.5 Pro', 'Gemini 2.5 Flash'])
})

test('o Enter envia pelo sendMessage do Mastra; "Pensando…" e "Parar" até chegar o texto (30)', async () => {
  const { field, line, sent } = await openConversation(conversationOf({ id: FIRST }))
  const asked = 'Compare dois apps de encomenda de padaria'
  say(field, asked)
  await waitFor(() => expect(typed(field)).toBe(''))
  expect(sent[0]?.body).toEqual({ message: asked })
  line().emit(AGENT_START)
  line().emit(RUNNING)
  line().emit(signalStarted(personSaid(asked).id, asked))
  expect(await screen.findByText('Pensando…')).toBeTruthy()
  expect(screen.getByText(asked)).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Parar' })).toBeTruthy()
  line().emit(stepStarted())
  line().emit(textDelta('O primeiro é '))
  expect(await screen.findByText(/O primeiro é/)).toBeTruthy()
  expect(screen.queryByText('Pensando…')).toBeNull()
})

test('Shift+Enter e o Enter de uma composição não enviam; o campo guarda o texto', async () => {
  const { field, sent } = await openConversation(conversationOf({ id: FIRST }))
  fireEvent.change(field, { target: { value: 'ação' } })
  fireEvent.keyDown(field, { key: 'Enter', shiftKey: true })
  fireEvent.keyDown(field, { key: 'Enter', isComposing: true })
  expect(sent).toHaveLength(0)
  expect(typed(field)).toBe('ação')
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  await waitFor(() => expect(sent).toHaveLength(1))
})

test('sem conta, a conversa mostra o aviso da etapa 11 e não deixa enviar', async () => {
  const { field } = await openConversation(conversationOf({ id: FIRST }), view({ providers: [] }))
  expect(
    screen.getByText(
      'Nenhuma conta que você pode usar atende a este modelo. Escolha outro modelo ou fale com quem administra a empresa.',
    ),
  ).toBeTruthy()
  const notice = screen.getByText(/Nenhuma conta que você pode usar/).parentElement
  const link = within(notice ?? document.body).getByRole('link', {
    name: 'Minhas contas de modelo',
  })
  expect(link.getAttribute('href')).toBe(`/companies/${COMPANY.id}/settings/model-accounts`)
  fireEvent.change(field, { target: { value: 'Oi' } })
  expect(screen.getByRole('button', { name: 'Enviar' }).hasAttribute('disabled')).toBe(true)
})

test('com contas que o Hub diz indisponíveis, a conversa mostra o aviso da etapa 11', async () => {
  await openConversation(conversationOf({ id: FIRST }), view({ usable: [] }))
  expect(screen.getByText(/Nenhuma conta que você pode usar/)).toBeTruthy()
  expect(screen.queryByRole('combobox', { name: 'Modelo e raciocínio' })).toBeNull()
})

test('trocar de modelo envia o novo modelo, para as próximas respostas', async () => {
  const { sent } = await openConversation(conversationOf({ id: FIRST }))
  await choose(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }), 'Gemini 2.5 Pro')
  await waitFor(() =>
    expect(sent.at(-1)?.body).toEqual({ model: 'google/gemini-2.5-pro', effort: 'off' }),
  )
  expect(sent.at(-1)?.method).toBe('PUT')
})

test('uma troca de modelo sem resposta lida diz que não foi confirmada', async () => {
  await openConversation(conversationOf({ id: FIRST }), view(), { model: () => Response.error() })
  await choose(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }), 'Gemini 2.5 Pro')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Não confirmamos a troca do modelo. Confira o modelo e tente de novo.',
  )
})

test('um envio sem resposta lida mantém o texto, e a nova tentativa envia de novo', async () => {
  let failing = true
  const { field, sent } = await openConversation(conversationOf({ id: FIRST }), view(), {
    message: () => (failing ? Response.error() : undefined),
  })
  say(field, 'Compare')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Não confirmamos o envio. Envie de novo.',
  )
  expect(typed(field)).toBe('Compare')
  expect(screen.queryByText('Pensando…')).toBeNull()
  failing = false
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  await waitFor(() => expect(sent).toHaveLength(2))
  expect(sent[1]?.body).toEqual({ message: 'Compare' })
})

test('uma conversa que não existe mostra a página de "não encontrado"', async () => {
  const { conexus } = open(view(), `${PROJECT}/conversations/${FIRST}`)
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  // The company's frame around the page still reads its companies; the test ends once it has.
  await waitFor(() => expect(conexus.queryClient.isFetching()).toBe(0))
})

test('sem thread no meio da conversa: não encontrado, e a linha sai da lista', async () => {
  const { field, shown, conexus } = await openConversation(conversationOf({ id: FIRST }))
  shown.conversations = []
  say(field, 'Compare')
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  await conexus.router.navigate({ to: PROJECT })
  expect(await screen.findByText('Nenhuma conversa')).toBeTruthy()
})
