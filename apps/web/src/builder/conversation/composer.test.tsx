import { MessageId, ModelId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { choose, conversationOf, FIRST, say, screens, typed, view } from './test-hub.tsx'

const { openConversation } = screens(hubServer())
const PICKER = { name: 'Modelo e raciocínio' }
// Base UI keeps the thumb hidden until it measures the track, which jsdom cannot; the browser
// suites name it (keyboard.test.ts).
const SLIDER = { hidden: true } as const

test('o anel do compositor só gira enquanto o Builder trabalha; enquanto ele trabalha, Parar e Enviar ficam lado a lado; Enter envia e Esc para', async () => {
  const { field, lines, sent } = await openConversation(conversationOf({ id: FIRST }))
  function ring() {
    return field.closest('.rounded-composer')
  }
  expect(ring()?.hasAttribute('data-busy')).toBe(false)
  say(field, 'Oi')
  const stop = await screen.findByRole('button', { name: 'Parar' })
  expect(ring()?.hasAttribute('data-busy')).toBe(true)
  expect(screen.getByRole('button', { name: 'Enviar' })).toBeTruthy()
  expect(field.getAttribute('placeholder')).toBe('Escreva para orientar o Builder')
  expect(screen.getByText('Enter orienta o Builder · Esc para')).toBeTruthy()
  say(field, 'Só eu cadastro.')
  await waitFor(() => expect(sent.filter((one) => one.path.endsWith('/messages'))).toHaveLength(2))
  fireEvent.keyDown(field, { key: 'Escape', isComposing: true })
  expect(sent.some((one) => one.path.endsWith('/stop'))).toBe(false)
  fireEvent.keyDown(field, { key: 'Escape' })
  await waitFor(() => expect(sent.at(-1)?.path).toMatch(/\/stop$/))
  stop.focus()
  fireEvent.click(stop)
  expect(document.activeElement).toBe(field)
  lines[0]?.emit({
    type: 'message_update',
    id: MessageId.parse('builder-1'),
    event: { type: 'text-delta', delta: 'Olá' },
  })
})

test('perto do campo uma linha pede para não colar senhas, chaves ou tokens na conversa', async () => {
  const { field } = await openConversation(conversationOf({ id: FIRST }))
  const line = screen.getByText('Não cole senhas, chaves ou tokens na conversa.')
  expect(field.closest('form')?.contains(line)).toBe(true)
})

test('o seletor mostra o controle deslizante dos níveis do modelo, o nome do nível, e a troca leva o modelo e o nível', async () => {
  const { sent } = await openConversation(conversationOf({ id: FIRST }))
  fireEvent.click(screen.getByRole('combobox', PICKER))
  await screen.findByText('Raciocínio')
  await screen.findByText('Raciocínio')
  const slider = await screen.findByRole('slider', SLIDER)
  expect(slider.getAttribute('aria-label')).toBe('Raciocínio')
  expect(slider.getAttribute('min')).toBe('0')
  expect(slider.getAttribute('max')).toBe('2')
  expect(slider.getAttribute('aria-valuetext')).toBe('Desligado')
  expect(screen.queryByRole('radiogroup')).toBeNull()
  fireEvent.keyDown(slider, { key: 'End' })
  await waitFor(() =>
    expect(sent.at(-1)?.body).toEqual({ model: 'anthropic/claude-sonnet-4', effort: 'high' }),
  )
  expect(screen.getByRole('combobox', PICKER).textContent).toContain('Alto')
  expect(slider.getAttribute('aria-valuetext')).toBe('Alto')
  fireEvent.keyDown(slider, { key: 'ArrowLeft' })
  await waitFor(() =>
    expect(sent.at(-1)?.body).toEqual({ model: 'anthropic/claude-sonnet-4', effort: 'low' }),
  )
  fireEvent.keyDown(slider, { key: 'Home' })
  await waitFor(() =>
    expect(sent.at(-1)?.body).toEqual({ model: 'anthropic/claude-sonnet-4', effort: 'off' }),
  )
})

test('um modelo sem níveis não mostra o controle, e a troca para ele volta o nível a Desligado', async () => {
  const { sent } = await openConversation(conversationOf({ id: FIRST, effort: 'high' }))
  await choose(screen.getByRole('combobox', PICKER), 'Claude Opus 4')
  await waitFor(() =>
    expect(sent.at(-1)?.body).toEqual({ model: 'anthropic/claude-opus-4', effort: 'off' }),
  )
  fireEvent.click(screen.getByRole('combobox', PICKER))
  await screen.findByRole('listbox')
  expect(screen.queryByRole('slider')).toBeNull()
  expect(screen.queryByText('Raciocínio')).toBeNull()
})

test('a troca para um modelo que sempre raciocina leva o nível mais baixo dele, não Desligado', async () => {
  const { sent } = await openConversation(
    conversationOf({ id: FIRST }),
    view({ providers: ['anthropic', 'openai'] }),
  )
  await choose(screen.getByRole('combobox', PICKER), 'GPT 5')
  await waitFor(() => expect(sent.at(-1)?.body).toEqual({ model: 'openai/gpt-5', effort: 'low' }))
})

test('uma conversa guardada em Desligado num modelo que sempre raciocina mostra o nível em que ele roda', async () => {
  await openConversation(
    conversationOf({ id: FIRST, model: ModelId.parse('openai/gpt-5'), effort: 'off' }),
    view({ providers: ['anthropic', 'openai'] }),
  )
  expect(screen.getByRole('combobox', PICKER).textContent).toContain('· Baixo')
})

test('um nível guardado abaixo do mais baixo de um modelo mostra o nível em que o Hub o roda, não Desligado', async () => {
  await openConversation(
    conversationOf({ id: FIRST, model: ModelId.parse('google/gemini-2.5-flash'), effort: 'low' }),
  )
  expect(screen.getByRole('combobox', PICKER).textContent).toContain('· Médio')
})

test('o nível que o modelo não aceita volta a frase do Hub, sem trocar o botão', async () => {
  await openConversation(conversationOf({ id: FIRST }), view(), {
    model: () => refusal('EFFORT_UNSUPPORTED'),
  })
  fireEvent.click(screen.getByRole('combobox', PICKER))
  fireEvent.keyDown(await screen.findByRole('slider', SLIDER), { key: 'End' })
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Este modelo não aceita esse nível de raciocínio. Escolha outro nível de raciocínio.',
  )
  expect(screen.getByRole('combobox', PICKER).textContent).not.toContain('Alto')
})

test('a busca do seletor estreita os modelos', async () => {
  await openConversation(conversationOf({ id: FIRST }))
  fireEvent.click(screen.getByRole('combobox', PICKER))
  fireEvent.change(await screen.findByLabelText('Buscar modelo'), { target: { value: 'GEMINI' } })
  await waitFor(() =>
    expect(screen.getAllByRole('option').map((one) => one.textContent)).toEqual([
      'Gemini 2.5 Pro',
      'Gemini 2.5 Flash',
    ]),
  )
  fireEvent.change(screen.getByLabelText('Buscar modelo'), { target: { value: 'zzz' } })
  expect(await screen.findByText('Nenhum modelo encontrado.')).toBeTruthy()
  expect(typed(screen.getByLabelText('Mensagem para o Builder'))).toBe('')
})

test('o que se digita enquanto o envio está no ar fica no campo; o texto enviado sai', async () => {
  const gate = Promise.withResolvers<void>()
  const { field, sent, reads } = await openConversation(conversationOf({ id: FIRST }), view(), {
    message: async () => {
      await gate.promise
      return undefined
    },
  })
  say(field, 'primeira')
  await waitFor(() => expect(sent.length).toBe(1))
  fireEvent.change(field, { target: { value: 'primeira e mais' } })
  const before = reads.length
  gate.resolve()
  await waitFor(() => expect(reads.length).toBeGreaterThan(before))
  expect(typed(field)).toBe('primeira e mais')
})

test('o texto enviado limpa o campo quando nada foi digitado depois', async () => {
  const { field, sent } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'só isto')
  await waitFor(() => expect(sent.length).toBe(1))
  await waitFor(() => expect(typed(field)).toBe(''))
})

test('a busca do seletor acha pelo nome e pelo id do modelo', async () => {
  await openConversation(conversationOf({ id: FIRST }))
  fireEvent.click(screen.getByRole('combobox', PICKER))
  fireEvent.change(await screen.findByLabelText('Buscar modelo'), { target: { value: 'opus-4' } })
  await waitFor(() =>
    expect(screen.getAllByRole('option').map((one) => one.textContent)).toEqual(['Claude Opus 4']),
  )
  fireEvent.change(screen.getByLabelText('Buscar modelo'), {
    target: { value: 'google/gemini-2.5-p' },
  })
  await waitFor(() =>
    expect(screen.getAllByRole('option').map((one) => one.textContent)).toEqual(['Gemini 2.5 Pro']),
  )
})
