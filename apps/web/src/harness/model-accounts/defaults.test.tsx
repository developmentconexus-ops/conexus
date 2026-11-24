import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, within } from '@testing-library/react'
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
    defaults: {
      company: null,
      mine: null,
      start: null,
      companyStart: {
        model: 'anthropic/claude-sonnet-5-5',
        effort: 'low',
        from: 'starter',
        account: 'Claude da empresa',
      },
    },
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
  expect(await screen.findByText('A empresa ainda não tem padrão.')).toBeTruthy()
  expect(screen.getByRole('region', { name: 'Conversa nova' })).toBeTruthy()
  await choose(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }), 'GPT 5')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar padrão' }))
  expect(
    await screen.findByText(
      'Com as contas da empresa, uma conversa nova começa em: GPT 5 · Desligado — padrão da empresa',
    ),
  ).toBeTruthy()
  expect(sent.map((one) => one.body)).toEqual([{ model: 'openai/gpt-5', effort: 'off' }])
  expect(screen.getByRole('button', { name: 'Salvar padrão' })).toHaveProperty('disabled', true)
})

const GPT_HIGH = { model: 'openai/gpt-5', effort: 'high' }

test('o padrão da empresa sem conta que responda: a frase diz onde começa e por quê', async () => {
  await open(
    view({
      defaults: {
        company: GPT_HIGH,
        mine: null,
        start: null,
        companyStart: {
          model: 'anthropic/claude-sonnet-5-5',
          effort: 'low',
          from: 'starter',
          account: 'Claude da empresa',
        },
      },
    }),
  )
  expect(
    await screen.findByText(
      'A empresa não tem conta disponível para OpenAI agora: as conversas novas começam no modelo inicial.',
    ),
  ).toBeTruthy()
})

test('sem conta da empresa em nenhum degrau: a frase e o caminho a Contas de modelo', async () => {
  await open(view({ defaults: { company: null, mine: null, start: null, companyStart: null } }))
  expect(
    await screen.findByText(/Nenhum padrão nem modelo inicial tem conta da empresa disponível\./),
  ).toBeTruthy()
  const link = within(screen.getByRole('main')).getByRole('link', { name: 'Contas de modelo' })
  expect(link.getAttribute('href')).toBe(`/companies/${COMPANY.id}/settings/model-accounts`)
})

test('o membro lê o valor e a frase de quem muda, sem o botão de salvar', async () => {
  await open(
    view({
      mayManage: false,
      defaults: {
        company: GPT_HIGH,
        mine: null,
        start: null,
        companyStart: { ...GPT_HIGH, from: 'company', account: 'OpenAI da empresa' },
      },
    }),
  )
  expect(
    await screen.findByText(
      'Com as contas da empresa, uma conversa nova começa em: GPT 5 · Alto — padrão da empresa',
    ),
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
  expect(screen.getByText('A empresa ainda não tem padrão.')).toBeTruthy()
})

test('o raciocínio salvo fica à vista depois de remover a conta', async () => {
  await open(
    view({
      connected: { mine: [], company: ['anthropic'] },
      defaults: {
        company: { model: 'openai/gpt-5', effort: 'medium' },
        mine: null,
        start: null,
        companyStart: {
          model: 'anthropic/claude-sonnet-5-5',
          effort: 'low',
          from: 'starter',
          account: 'Claude da empresa',
        },
      },
    }),
  )
  const picker = await screen.findByRole('combobox', { name: 'Modelo e raciocínio' })
  expect(picker.textContent).toContain('GPT 5')
  expect(picker.textContent).toContain('Médio')
})
