import { ModelId } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import type { Answers, View } from './test-hub.tsx'
import { choose, modelHub } from './test-hub.tsx'

const server = hubServer()

function open(shown: View, answers: Answers = {}) {
  const hub = modelHub(shown, answers)
  server.use(...hub.handlers)
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}/settings/model-accounts`] }),
  )
  render(<Conexus conexus={conexus} />)
  return hub
}

function view(fields: Partial<View> = {}): View {
  return {
    company: [],
    mine: [],
    order: [],
    kinds: [],
    connected: { mine: [], company: ['anthropic', 'mistral', 'openai'] },
    mayManage: true,
    ...fields,
  }
}

async function addModel(label: string) {
  await choose(screen.getByLabelText('Modelo da troca'), label)
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar à fila' }))
  expect(await screen.findByLabelText(`Tirar ${label}`)).toBeTruthy()
}

const OPUS = ModelId.parse('anthropic/claude-opus-4')
const SONNET = ModelId.parse('anthropic/claude-sonnet-4')
const GPT = ModelId.parse('openai/gpt-5')

test('Troca automática: cada mudança salva uma vez, na revisão lida, e nenhum Salvar', async () => {
  const shown = view()
  const { sent } = open(shown)
  const section = await screen.findByRole('region', { name: 'Troca automática' })
  expect(within(section).getByText('Nenhum modelo na fila')).toBeTruthy()
  expect(within(section).queryByRole('button', { name: /Salvar/ })).toBeNull()

  await addModel('Claude Sonnet 4')
  await waitFor(() => expect(shown.fallback?.revision).toBe(1))
  await addModel('GPT 5')
  await waitFor(() => expect(shown.fallback?.revision).toBe(2))
  fireEvent.click(await screen.findByLabelText('Subir GPT 5'))
  await waitFor(() => expect(shown.fallback?.revision).toBe(3))
  fireEvent.click(await screen.findByRole('switch', { name: /Trocar para o próximo modelo/ }))
  await waitFor(() => expect(shown.fallback?.revision).toBe(4))
  fireEvent.click(await screen.findByLabelText('Tirar Claude Sonnet 4'))
  await waitFor(() => expect(shown.fallback?.revision).toBe(5))

  expect(sent.map((one) => one.body)).toEqual([
    { enabled: false, chain: [SONNET], revision: 0 },
    { enabled: false, chain: [SONNET, GPT], revision: 1 },
    { enabled: false, chain: [GPT, SONNET], revision: 2 },
    { enabled: true, chain: [GPT, SONNET], revision: 3 },
    { enabled: true, chain: [GPT], revision: 4 },
  ])
  expect(
    (await screen.findByRole('switch', { name: /Trocar para o próximo modelo/ })).getAttribute(
      'aria-checked',
    ),
  ).toBe('true')
})

test('Troca automática: os controles ficam desabilitados até a resposta, e o foco volta à seta usada', async () => {
  const held = Promise.withResolvers<void>()
  const shown = view({ fallback: { enabled: true, chain: [SONNET, GPT], revision: 0 } })
  const { sent } = open(shown)
  const up = await screen.findByLabelText('Subir GPT 5')
  server.use(
    http.put('*/model-fallback', async () => {
      await held.promise
      return undefined
    }),
  )
  up.focus()
  fireEvent.click(up)
  await waitFor(() => expect(screen.getByLabelText('Tirar GPT 5')).toHaveProperty('disabled', true))
  expect(screen.getByRole('switch', { name: /Trocar/ }).getAttribute('aria-disabled')).toBe('true')
  held.resolve()
  await waitFor(() => expect(sent).toHaveLength(1))
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Descer GPT 5')))
})

test('Troca automática: a revisão velha relê e mostra o salvo com a frase da recusa', async () => {
  const shown = view({ fallback: { enabled: true, chain: [GPT, OPUS], revision: 3 } })
  const { sent } = open(shown, { fallback: () => refusal('MODEL_FALLBACK_STALE') })
  fireEvent.click(await screen.findByLabelText('Tirar GPT 5'))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'A troca automática mudou. Recarregue a página.',
  )
  expect(sent.map((one) => one.body)).toEqual([{ enabled: true, chain: [OPUS], revision: 3 }])
  expect(await screen.findByLabelText('Tirar GPT 5')).toBeTruthy()
  expect(shown.fallback?.revision).toBe(3)
})

test('Troca automática: a resposta cortada diz que não confirmou e volta ao salvo', async () => {
  const shown = view({ fallback: { enabled: false, chain: [GPT], revision: 2 } })
  open(shown, { fallback: () => new HttpResponse('{"enabled"', { status: 200 }) })
  fireEvent.click(await screen.findByRole('switch', { name: /Trocar/ }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Não confirmamos a mudança. Veja a lista.',
  )
  await waitFor(() =>
    expect(screen.getByRole('switch', { name: /Trocar/ }).getAttribute('aria-checked')).toBe(
      'false',
    ),
  )
})

test('Troca automática: uma frase liga a fila das contas à fila da troca', async () => {
  open(view())
  const section = await screen.findByRole('region', { name: 'Troca automática' })
  expect(section.textContent).toContain('O Builder tenta as contas nesta ordem')
  expect(section.textContent).toContain(
    'quando as contas de um modelo acabam, a conversa segue com o próximo modelo da fila',
  )
})

const SWITCH = /Trocar para o próximo modelo/

test('Troca automática: o foco não é tomado ao abrir e volta à chave depois de ligá-la', async () => {
  const shown = view({ fallback: { enabled: false, chain: [SONNET], revision: 0 } })
  const { sent } = open(shown)
  const chave = await screen.findByRole('switch', { name: SWITCH })
  expect(document.activeElement).not.toBe(chave)
  fireEvent.click(chave)
  await waitFor(() => expect(sent).toHaveLength(1))
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('switch', { name: SWITCH })),
  )
  expect(screen.getByRole('switch', { name: SWITCH }).getAttribute('aria-checked')).toBe('true')
})

test('Troca automática: depois da chave, o foco de uma seta fica na seta e não volta à chave', async () => {
  const shown = view({ fallback: { enabled: false, chain: [SONNET, GPT], revision: 0 } })
  const { sent } = open(shown)
  fireEvent.click(await screen.findByRole('switch', { name: SWITCH }))
  await waitFor(() => expect(sent).toHaveLength(1))
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('switch', { name: SWITCH })),
  )
  const down = await screen.findByLabelText('Descer Claude Sonnet 4')
  await waitFor(() => expect(down).toHaveProperty('disabled', false))
  down.focus()
  fireEvent.click(down)
  await waitFor(() => expect(sent).toHaveLength(2))
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByLabelText('Subir Claude Sonnet 4')),
  )
})

test('Troca automática: descer troca com o próximo, diz o lugar novo e mostra a posição de cada modelo', async () => {
  const shown = view({ fallback: { enabled: true, chain: [SONNET, GPT], revision: 0 } })
  const { sent } = open(shown)
  const list = within(await screen.findByRole('region', { name: 'Troca automática' })).getByRole(
    'list',
  )
  expect(
    within(list)
      .getAllByRole('listitem')
      .map((one) => one.textContent?.[0]),
  ).toEqual(['1', '2'])
  expect(screen.getByLabelText('Subir Claude Sonnet 4')).toHaveProperty('disabled', true)
  expect(screen.getByLabelText('Descer GPT 5')).toHaveProperty('disabled', true)
  fireEvent.click(screen.getByLabelText('Descer Claude Sonnet 4'))
  await waitFor(() =>
    expect(sent.map((one) => one.body)).toEqual([
      { enabled: true, chain: [GPT, SONNET], revision: 0 },
    ]),
  )
  expect((await screen.findByRole('status')).textContent).toBe(
    'Claude Sonnet 4 agora é a 2ª da fila da troca.',
  )
})

test('Troca automática: uma mudança recusada não deixa foco nem frase para a próxima', async () => {
  let recusar = true
  const shown = view({ fallback: { enabled: true, chain: [GPT, OPUS], revision: 3 } })
  open(shown, { fallback: () => (recusar ? refusal('MODEL_FALLBACK_STALE') : undefined) })
  fireEvent.click(await screen.findByLabelText('Descer GPT 5'))
  await screen.findByRole('alert')
  recusar = false
  await addModel('Claude Sonnet 4')
  expect(screen.getByRole('status').textContent).toBe('')
})

test('Troca automática: só adiciona um modelo escolhido e que ainda não está na fila, e o campo esvazia', async () => {
  const shown = view({ fallback: { enabled: true, chain: [GPT], revision: 0 } })
  const { sent } = open(shown)
  const add = await screen.findByRole('button', { name: 'Adicionar à fila' })
  expect(add).toHaveProperty('disabled', true)
  await choose(screen.getByLabelText('Modelo da troca'), 'GPT 5')
  expect(add).toHaveProperty('disabled', true)
  await choose(screen.getByLabelText('Modelo da troca'), 'Claude Opus 4')
  expect(add).toHaveProperty('disabled', false)
  fireEvent.click(add)
  await waitFor(() => expect(sent).toHaveLength(1))
  await waitFor(() => expect(add).toHaveProperty('disabled', true))
  expect(screen.getByLabelText('Modelo da troca').textContent).not.toContain('Opus')
})
