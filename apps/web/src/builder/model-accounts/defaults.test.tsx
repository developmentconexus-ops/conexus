import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import type { Answers, View } from './test-hub.tsx'
import { choose, modelHub } from './test-hub.tsx'

const server = hubServer()
const PAGE = `/companies/${COMPANY.id}/settings/defaults`

function view(fields: Partial<View> = {}): View {
  return {
    company: [],
    mine: [],
    order: [],
    kinds: [],
    connected: { mine: [], company: ['anthropic', 'openai'] },
    defaults: { company: null, mine: null, start: null },
    mayManage: true,
    ...fields,
  }
}

async function open(shown: View, answers: Answers = {}) {
  const hub = modelHub(shown, answers)
  server.use(...hub.handlers)
  const conexus = createConexus(createMemoryHistory({ initialEntries: [PAGE] }))
  render(<Conexus conexus={conexus} />)
  await screen.findByRole('heading', { name: 'Padrões da empresa' })
  return hub
}

test('o dono sem padrão: a frase da empresa, escolhe o modelo e salva; a linha do topo passa ao novo padrão', async () => {
  const shown = view()
  const { sent } = await open(shown)
  expect(
    await screen.findByText(
      'A empresa ainda não tem padrão: as conversas novas começam no modelo inicial.',
    ),
  ).toBeTruthy()
  expect(screen.getByText('Toda a empresa')).toBeTruthy()
  await choose(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }), 'GPT 5')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar padrão' }))
  expect(
    await screen.findByText('Uma conversa nova começa em: GPT 5 · Desligado — padrão da empresa'),
  ).toBeTruthy()
  expect(sent.map((one) => one.body)).toEqual([{ model: 'openai/gpt-5', effort: 'off' }])
  expect(screen.getByRole('button', { name: 'Salvar padrão' })).toHaveProperty('disabled', true)
})

test('o membro lê o valor e a frase de quem muda, sem o botão de salvar', async () => {
  await open(
    view({
      mayManage: false,
      defaults: { company: { model: 'openai/gpt-5', effort: 'high' }, mine: null, start: null },
    }),
  )
  expect(
    await screen.findByText('Uma conversa nova começa em: GPT 5 · Alto — padrão da empresa'),
  ).toBeTruthy()
  expect(screen.getByText('Só o dono ou um administrador muda os padrões da empresa.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Salvar padrão' })).toBeNull()
  expect(screen.queryByRole('combobox', { name: 'Modelo e raciocínio' })).toBeNull()
})

test('uma recusa fica no campo com a frase do código, e o valor escolhido continua', async () => {
  await open(view(), { default: () => refusal('MODEL_NO_ACCOUNT') })
  await choose(await screen.findByRole('combobox', { name: 'Modelo e raciocínio' }), 'GPT 5')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar padrão' }))
  expect((await screen.findByRole('alert')).textContent).toContain('conta')
  expect(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }).textContent).toContain(
    'GPT 5',
  )
  expect(
    screen.getByText(
      'A empresa ainda não tem padrão: as conversas novas começam no modelo inicial.',
    ),
  ).toBeTruthy()
})
