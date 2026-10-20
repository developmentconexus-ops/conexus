import { MessageId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import {
  builderSaid,
  choose,
  conversationOf,
  FIRST,
  PROJECT,
  say,
  screens,
  typed,
  view,
} from './test-hub.tsx'

const { open, openConversation } = screens(hubServer())

test('a conversa mostra o modelo, só dos fornecedores com conta, e as mensagens', async () => {
  const { shown } = await openConversation(
    conversationOf({
      id: FIRST,
      title: 'Padarias',
      messages: [
        {
          id: MessageId.parse('p1'),
          role: 'person',
          parts: [{ type: 'text', text: 'Oi' }],
          model: null,
          createdAt: '2026-10-19T12:00:00.000Z',
        },
        builderSaid('Olá, **tudo bem**?'),
      ],
    }),
  )
  expect(shown.conversations).toHaveLength(1)
  expect(screen.getByRole('combobox', { name: 'Conversas' })).toHaveProperty('value', 'Padarias')
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  expect(within(log).getByText('Oi')).toBeTruthy()
  expect(within(log).getByText('tudo bem').tagName).toBe('STRONG')
  expect(screen.getByLabelText('Fornecedor do modelo').textContent).toContain('Anthropic')
  fireEvent.click(screen.getByLabelText('Fornecedor do modelo'))
  const providers = (await screen.findAllByRole('option')).map((one) => one.textContent)
  expect(providers).toEqual(['Anthropic', 'Google'])
})

test('o Enter envia com a chave da tentativa; "Pensando…" e "Parar" até chegar o texto', async () => {
  const { field, lines, sent } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare dois apps de encomenda de padaria')
  expect(await screen.findByText('Pensando…')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Parar' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Enviar' }).hasAttribute('disabled')).toBe(true)
  await waitFor(() => expect(typed(field)).toBe(''))
  expect(sent[0]?.body).toEqual({ content: 'Compare dois apps de encomenda de padaria' })
  expect(sent[0]?.attemptKey).toMatch(/^[0-9a-f-]{36}$/)
  expect(await screen.findByText('Compare dois apps de encomenda de padaria')).toBeTruthy()
  lines[0]?.emit({ type: 'text', delta: 'O primeiro é ' })
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
  expect(
    within(notice ?? document.body).getByRole('link', { name: 'Minha conta de modelo' }),
  ).toBeTruthy()
  fireEvent.change(field, { target: { value: 'Oi' } })
  expect(screen.getByRole('button', { name: 'Enviar' }).hasAttribute('disabled')).toBe(true)
})

test('com contas que o Hub diz indisponíveis, a conversa mostra o aviso da etapa 11', async () => {
  await openConversation(conversationOf({ id: FIRST }), view({ usable: [] }))
  expect(screen.getByText(/Nenhuma conta que você pode usar/)).toBeTruthy()
  expect(screen.queryByLabelText('Fornecedor do modelo')).toBeNull()
})

test('trocar de modelo envia o novo modelo, para as próximas respostas', async () => {
  const { sent } = await openConversation(conversationOf({ id: FIRST }))
  expect(screen.getByText('A troca vale para as próximas respostas.')).toBeTruthy()
  await choose(screen.getByLabelText('Fornecedor do modelo'), 'Google')
  await choose(await screen.findByLabelText('Modelo'), 'gemini-2.5-pro')
  await waitFor(() =>
    expect(sent.at(-1)?.body).toEqual({ model: 'google/gemini-2.5-pro', effort: 'off' }),
  )
  expect(sent.at(-1)?.method).toBe('PUT')
})

test('uma troca de modelo sem resposta lida diz que não foi confirmada', async () => {
  await openConversation(conversationOf({ id: FIRST }), view(), { model: () => Response.error() })
  await choose(screen.getByLabelText('Fornecedor do modelo'), 'Google')
  await choose(await screen.findByLabelText('Modelo'), 'gemini-2.5-pro')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Não confirmamos a troca do modelo. Confira o modelo e tente de novo.',
  )
})

test('um envio sem resposta lida mantém o texto e repete a mesma chave na nova tentativa', async () => {
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
  expect(sent[1]?.attemptKey).toBe(sent[0]?.attemptKey)
})

test('uma conversa que não existe mostra a página de "não encontrado"', async () => {
  open(view(), `${PROJECT}/conversations/${FIRST}`)
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
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
