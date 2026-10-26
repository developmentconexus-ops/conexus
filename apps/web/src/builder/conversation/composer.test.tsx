import { ModelId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { AGENT_START, RUNNING, textDelta } from './test-events.ts'
import { choose, conversationOf, FIRST, onPhone, say, screens, typed, view } from './test-hub.tsx'

const { openConversation } = screens(hubServer())
const SECRETS = 'Não cole senhas ou chaves na conversa.'
const PICKER = { name: 'Modelo e raciocínio' }
// Base UI keeps the thumb hidden until it measures the track, which jsdom cannot; the browser
// suites name it (keyboard.test.ts).
const SLIDER = { hidden: true } as const

test('o anel do compositor só gira enquanto o Builder trabalha; Enter envia e Esc para', async () => {
  const { field, line, sent } = await openConversation(conversationOf({ id: FIRST }))
  function ring() {
    return field.closest('.rounded-composer')
  }
  expect(ring()?.hasAttribute('data-busy')).toBe(false)
  say(field, 'Oi')
  await waitFor(() => expect(sent).toHaveLength(1))
  line().emit(AGENT_START)
  line().emit(RUNNING)
  await screen.findByRole('button', { name: 'Parar' })
  expect(ring()?.hasAttribute('data-busy')).toBe(true)
  expect(field.getAttribute('placeholder')).toBe('Escreva para orientar o Builder')
  say(field, 'Só eu cadastro.')
  await waitFor(() => expect(sent.filter((one) => one.path.endsWith('/messages'))).toHaveLength(2))
  fireEvent.keyDown(field, { key: 'Escape', isComposing: true })
  expect(sent.some((one) => one.path.endsWith('/abort'))).toBe(false)
  fireEvent.keyDown(field, { key: 'Escape' })
  await waitFor(() => expect(sent.at(-1)?.path).toMatch(/\/abort$/))
  line().emit(textDelta('Olá'))
})

test('um botão só: Parar com a caixa vazia, Enviar com texto, e o foco volta ao campo', async () => {
  const { field, line, sent } = await openConversation(conversationOf({ id: FIRST }))
  const idle = screen.getByRole('button', { name: 'Enviar' })
  expect(idle.hasAttribute('disabled')).toBe(true)
  expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull()
  say(field, 'Oi')
  await waitFor(() => expect(sent).toHaveLength(1))
  line().emit(AGENT_START)
  line().emit(RUNNING)
  const stop = await screen.findByRole('button', { name: 'Parar' })
  expect(screen.queryByRole('button', { name: 'Enviar' })).toBeNull()
  fireEvent.change(field, { target: { value: 'Só eu cadastro.' } })
  const send = await screen.findByRole('button', { name: 'Enviar' })
  expect(send.hasAttribute('disabled')).toBe(false)
  expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull()
  fireEvent.change(field, { target: { value: '' } })
  expect(await screen.findByRole('button', { name: 'Parar' })).toBe(stop)
  stop.focus()
  fireEvent.click(stop)
  expect(document.activeElement).toBe(field)
  await waitFor(() => expect(sent.at(-1)?.path).toMatch(/\/abort$/))
})

async function expectOneRow() {
  const { field } = await openConversation(conversationOf({ id: FIRST }))
  const form = field.closest('form')
  const row = form?.querySelector('[data-slot="input-group-addon"]')
  const names = [...(row?.querySelectorAll('button, [role="combobox"]') ?? [])].map((one) =>
    one.getAttribute('aria-label'),
  )
  expect(row?.contains(screen.getByRole('button', { name: /Memória da conversa/ }))).toBe(true)
  expect(row?.contains(screen.getByRole('combobox', PICKER))).toBe(true)
  expect(row?.contains(screen.getByRole('button', { name: 'Enviar' }))).toBe(true)
  expect(names.at(0)).toMatch(/Memória da conversa/)
  expect(names.at(-1)).toBe('Enviar')
  expect(form?.querySelectorAll('[data-slot="input-group-addon"]')).toHaveLength(1)
}

test(
  'uma linha de ações no computador: a memória, o modelo e o botão, dentro da caixa',
  expectOneRow,
)

test('uma linha de ações no celular: a memória, o modelo e o botão, dentro da caixa', () =>
  onPhone(expectOneRow))

test('a caixa começa com uma linha e cresce com o texto', async () => {
  const { field } = await openConversation(conversationOf({ id: FIRST }))
  expect(field.className).toContain('field-sizing-content')
  expect(field.className).toContain('min-h-9')
  expect(field.className).toContain('max-h-48')
  expect(field.className).not.toMatch(/(^|\s)(md:|max-md:)?min-h-(11|16)/)
})

test('embaixo da caixa só a linha das senhas, sem dica de teclado', async () => {
  const { field } = await openConversation(conversationOf({ id: FIRST }))
  const line = screen.getByText(SECRETS)
  expect(field.closest('form')?.contains(line)).toBe(true)
  expect(line.className).toContain('text-fact')
  expect(screen.queryByText(/Shift\+Enter/)).toBeNull()
  expect(screen.queryByText(/Enter orienta/)).toBeNull()
  expect(field.closest('form')?.querySelectorAll('p')).toHaveLength(1)
})

test('no celular, a linha das senhas sai do rodapé: fica na conversa vazia e na folha do modelo', async () => {
  await onPhone(async () => {
    const { field } = await openConversation(conversationOf({ id: FIRST }))
    const line = screen.getByText(SECRETS)
    expect(field.closest('form')?.contains(line)).toBe(false)
    fireEvent.click(screen.getByRole('combobox', PICKER))
    await screen.findByText('Raciocínio')
    expect(screen.getAllByText(SECRETS)).toHaveLength(2)
  })
})

test('no toque, Enter quebra a linha e só o botão envia', async () => {
  await onPhone(async () => {
    const { field, sent } = await openConversation(conversationOf({ id: FIRST }))
    fireEvent.change(field, { target: { value: 'Oi' } })
    expect(fireEvent.keyDown(field, { key: 'Enter' })).toBe(true)
    await new Promise((settled) => setTimeout(settled, 50))
    expect(sent.filter((one) => one.path.endsWith('/messages'))).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
    await waitFor(() =>
      expect(sent.filter((one) => one.path.endsWith('/messages'))).toHaveLength(1),
    )
  })
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
  const { field, sent, conversationReads } = await openConversation(
    conversationOf({ id: FIRST }),
    view(),
    {
      message: async () => {
        await gate.promise
        return undefined
      },
    },
  )
  say(field, 'primeira')
  await waitFor(() => expect(sent.length).toBe(1))
  fireEvent.change(field, { target: { value: 'primeira e mais' } })
  const before = conversationReads.length
  gate.resolve()
  await waitFor(() => expect(conversationReads.length).toBeGreaterThan(before))
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

test('Enter duas vezes antes de o envio responder manda a mensagem uma única vez', async () => {
  const gate = Promise.withResolvers<void>()
  const { field, sent } = await openConversation(conversationOf({ id: FIRST }), view(), {
    message: async () => {
      await gate.promise
      return undefined
    },
  })
  say(field, 'uma só')
  fireEvent.keyDown(field, { key: 'Enter' })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  await waitFor(() => expect(sent.length).toBe(1))
  gate.resolve()
  await waitFor(() => expect(typed(field)).toBe(''))
  expect(sent.filter((one) => one.path.endsWith('/messages'))).toHaveLength(1)
})
