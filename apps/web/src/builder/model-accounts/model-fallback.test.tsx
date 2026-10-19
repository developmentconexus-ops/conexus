import { ModelId } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
    createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}/setup`] }),
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
    defaultModel: null,
    mayManage: true,
    ...fields,
  }
}

async function addModel(provider: string, model: string, label: string) {
  await choose(screen.getByLabelText('Fornecedor do modelo da troca'), provider)
  await choose(screen.getByLabelText('Modelo da troca'), label)
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar à fila' }))
  expect(await screen.findByLabelText(`Tirar ${model}`)).toBeTruthy()
}

test('Troca automática: começa desligada; monta a fila, liga e salva na revisão lida', async () => {
  const shown = view()
  const { sent } = open(shown)
  const section = await screen.findByRole('region', { name: 'Troca automática' })
  expect(within(section).getByText('Desligada')).toBeTruthy()
  expect(within(section).getByText('Nenhum modelo na fila')).toBeTruthy()
  await addModel('Anthropic', 'anthropic/claude-sonnet-4', 'claude-sonnet-4')
  await addModel('OpenAI', 'openai/gpt-5', 'gpt-5')
  fireEvent.click(screen.getByLabelText('Subir openai/gpt-5'))
  fireEvent.click(screen.getByRole('checkbox', { name: /Trocar para o próximo modelo/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar troca automática' }))
  await waitFor(() =>
    expect(shown.fallback).toEqual({
      enabled: true,
      chain: ['openai/gpt-5', 'anthropic/claude-sonnet-4'],
      revision: 1,
    }),
  )
  expect(sent.map((one) => one.body)).toEqual([
    { enabled: true, chain: ['openai/gpt-5', 'anthropic/claude-sonnet-4'], revision: 0 },
  ])
  expect(await screen.findByText('Ligada')).toBeTruthy()
})

test('Troca automática: tira um modelo; a versão velha mostra a frase do 412 e o que veio fica', async () => {
  const shown = view({
    fallback: {
      enabled: true,
      chain: ['openai/gpt-5', 'anthropic/claude-opus-4'].map((id) => ModelId.parse(id)),
      revision: 3,
    },
  })
  const { sent } = open(shown, { fallback: () => refusal('MODEL_FALLBACK_STALE') })
  expect(await screen.findByText('Ligada')).toBeTruthy()
  fireEvent.click(screen.getByLabelText('Tirar openai/gpt-5'))
  expect(screen.queryByLabelText('Tirar openai/gpt-5')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Salvar troca automática' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'A troca automática mudou. Recarregue a página.',
  )
  expect(sent.map((one) => one.body)).toEqual([
    { enabled: true, chain: ['anthropic/claude-opus-4'], revision: 3 },
  ])
  expect(shown.fallback?.revision).toBe(3)
})
