import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { choose, conversationOf, FIRST, say, screens, typed, view } from './test-hub.tsx'

const { openConversation } = screens(hubServer())
const PICKER = { name: 'Modelo e raciocínio' }

test('o anel do compositor só gira enquanto o Builder trabalha; Enviar vira Parar e o foco volta ao campo', async () => {
  const { field, lines } = await openConversation(conversationOf({ id: FIRST }))
  function ring() {
    return field.closest('.rounded-composer')
  }
  expect(ring()?.hasAttribute('data-busy')).toBe(false)
  say(field, 'Oi')
  const stop = await screen.findByRole('button', { name: 'Parar' })
  expect(ring()?.hasAttribute('data-busy')).toBe(true)
  expect(screen.queryByRole('button', { name: 'Enviar' })).toBeNull()
  stop.focus()
  fireEvent.click(stop)
  expect(document.activeElement).toBe(field)
  lines[0]?.emit({ type: 'text', delta: 'Olá' })
})

test('o seletor mostra os níveis do modelo e a troca de nível leva o modelo e o nível', async () => {
  const { sent } = await openConversation(conversationOf({ id: FIRST }))
  fireEvent.click(screen.getByRole('combobox', PICKER))
  const levels = await screen.findByRole('radiogroup', { name: 'Raciocínio' })
  expect(
    within(levels)
      .getAllByRole('radio')
      .map((one) => one.textContent),
  ).toEqual(['Desligado', 'Baixo', 'Alto'])
  fireEvent.click(within(levels).getByRole('radio', { name: 'Alto' }))
  await waitFor(() =>
    expect(sent.at(-1)?.body).toEqual({ model: 'anthropic/claude-sonnet-4', effort: 'high' }),
  )
  expect(screen.getByRole('combobox', PICKER).textContent).toContain('Alto')
})

test('um modelo sem níveis não mostra a seção, e a troca para ele volta o nível a Desligado', async () => {
  const { sent } = await openConversation(conversationOf({ id: FIRST, effort: 'high' }))
  await choose(screen.getByRole('combobox', PICKER), 'claude-opus-4')
  await waitFor(() =>
    expect(sent.at(-1)?.body).toEqual({ model: 'anthropic/claude-opus-4', effort: 'off' }),
  )
  fireEvent.click(screen.getByRole('combobox', PICKER))
  await screen.findByRole('listbox')
  expect(screen.queryByText('Raciocínio')).toBeNull()
})

test('o nível que o modelo não aceita volta a frase do Hub, sem trocar o botão', async () => {
  await openConversation(conversationOf({ id: FIRST }), view(), {
    model: () => refusal('EFFORT_UNSUPPORTED'),
  })
  fireEvent.click(screen.getByRole('combobox', PICKER))
  fireEvent.click(await screen.findByRole('radio', { name: 'Alto' }))
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
    expect(screen.getAllByRole('option').map((one) => one.textContent)).toEqual(['gemini-2.5-pro']),
  )
  fireEvent.change(screen.getByLabelText('Buscar modelo'), { target: { value: 'zzz' } })
  expect(await screen.findByText('Nenhum modelo encontrado.')).toBeTruthy()
  expect(typed(screen.getByLabelText('Mensagem para o Builder'))).toBe('')
})
