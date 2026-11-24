import { ProviderId } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import type { Answers, View } from './test-hub.tsx'
import { accountOf, choose, modelHub } from './test-hub.tsx'

const server = hubServer()
const PAGE = `/companies/${COMPANY.id}/settings/my-defaults`
const SONNET = 'anthropic/claude-sonnet-4'
const GPT = 'openai/gpt-5'
const COMPANY_DEFAULT = { model: GPT, effort: 'off' }
const SAVED = 'Salvar padrão'

function view(fields: Partial<View> = {}): View {
  return {
    company: [],
    mine: [accountOf({ label: 'Minha Claude', owner: 'me' })],
    order: [],
    kinds: [],
    connected: { mine: ['anthropic', 'openai'], company: [] },
    defaults: {
      company: COMPANY_DEFAULT,
      mine: null,
      start: { ...COMPANY_DEFAULT, from: 'company', account: 'Claude da empresa' },
      companyStart: { ...COMPANY_DEFAULT, from: 'company', account: 'Claude da empresa' },
    },
    mayManage: false,
    ...fields,
  }
}

async function open(shown: View, answers: Answers = {}) {
  const hub = modelHub(shown, answers)
  server.use(...hub.handlers)
  const conexus = createConexus(createMemoryHistory({ initialEntries: [PAGE] }))
  render(<Conexus conexus={conexus} />)
  await screen.findByRole('heading', { name: 'Meus padrões' })
  return hub
}

test('sem padrão próprio: a linha de início diz o padrão da empresa, o botão vem sem valor e não há Usar o da empresa', async () => {
  await open(view())
  expect(
    await screen.findByText('Uma conversa nova começa em: GPT 5 · Desligado — padrão da empresa'),
  ).toBeTruthy()
  expect(screen.getByText('Você segue o padrão da empresa.')).toBeTruthy()
  expect(screen.getByText('Padrão da empresa: GPT 5 · Desligado')).toBeTruthy()
  expect(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }).textContent).toBe(
    'Escolha um modelo',
  )
  expect(screen.getByRole('button', { name: SAVED })).toHaveProperty('disabled', true)
  expect(screen.queryByRole('button', { name: 'Usar o da empresa' })).toBeNull()
})

test('o padrão da empresa que o modelo não aceita desligado: a linha da empresa diz o nível em que a conversa roda, como o topo', async () => {
  const saved = { model: 'mistral/mistral-large', effort: 'off' }
  const running = { ...saved, effort: 'low' }
  await open(
    view({
      defaults: {
        company: saved,
        mine: null,
        start: { ...running, from: 'company', account: 'Claude da empresa' },
        companyStart: { ...running, from: 'company', account: 'Claude da empresa' },
      },
    }),
  )
  expect(
    await screen.findByText(
      'Uma conversa nova começa em: Mistral Large · Baixo — padrão da empresa',
    ),
  ).toBeTruthy()
  expect(screen.getByText('Padrão da empresa: Mistral Large · Baixo')).toBeTruthy()
  expect(screen.queryByText(/Desligado/)).toBeNull()
})

test('salvar o seu: o modelo e o nível seguem ao Hub, o topo passa a "seu padrão"; Usar o da empresa o desfaz', async () => {
  const { sent } = await open(view())
  await choose(
    await screen.findByRole('combobox', { name: 'Modelo e raciocínio' }),
    'Claude Sonnet 4',
  )
  fireEvent.click(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }))
  fireEvent.keyDown(await screen.findByRole('slider', { hidden: true }), { key: 'End' })
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
  fireEvent.click(screen.getByRole('button', { name: SAVED }))
  expect(
    await screen.findByText('Uma conversa nova começa em: Claude Sonnet 4 · Alto — seu padrão'),
  ).toBeTruthy()
  expect(sent.map((one) => [one.method, one.body])).toEqual([
    ['PUT', { model: SONNET, effort: 'high' }],
  ])
  fireEvent.click(await screen.findByRole('button', { name: 'Usar o da empresa' }))
  expect(
    await screen.findByText('Uma conversa nova começa em: GPT 5 · Desligado — padrão da empresa'),
  ).toBeTruthy()
  expect(sent.at(-1)?.method).toBe('DELETE')
  expect(screen.queryByRole('button', { name: 'Usar o da empresa' })).toBeNull()
})

test('sem conta usável em nenhum degrau: a frase e o caminho a Minhas contas de modelo', async () => {
  await open(view({ defaults: { company: null, mine: null, start: null, companyStart: null } }))
  expect(
    await screen.findByText(/Nenhum padrão nem modelo inicial tem conta sua disponível\./),
  ).toBeTruthy()
  const link = within(screen.getByRole('main')).getByRole('link', {
    name: 'Minhas contas de modelo',
  })
  expect(link.getAttribute('href')).toBe(`/companies/${COMPANY.id}/settings/model-accounts`)
})

test('o padrão próprio sem conta usável agora: a frase com o fornecedor e o degrau que vale', async () => {
  await open(
    view({
      defaults: {
        company: COMPANY_DEFAULT,
        mine: { model: SONNET, effort: 'low' },
        start: { ...COMPANY_DEFAULT, from: 'company', account: 'Claude da empresa' },
        companyStart: { ...COMPANY_DEFAULT, from: 'company', account: 'Claude da empresa' },
      },
    }),
  )
  expect(
    await screen.findByText(
      'Você não tem conta disponível para Anthropic agora: as conversas novas começam no padrão da empresa.',
    ),
  ).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Usar o da empresa' })).toBeTruthy()
})

test('a conta usada primeiro é a que o Hub dá, com Mudar a ordem', async () => {
  const paused = accountOf({ label: 'Pausada', owner: 'me', position: 0, state: 'paused' })
  const ready = accountOf({ label: 'Claude da empresa', position: 1 })
  await open(
    view({
      company: [ready],
      mine: [paused],
      order: [{ provider: ProviderId.parse('anthropic'), accounts: [paused.id, ready.id] }],
      defaults: {
        company: null,
        mine: { model: SONNET, effort: 'off' },
        start: { model: SONNET, effort: 'off', from: 'mine', account: 'Claude da empresa' },
        companyStart: null,
      },
    }),
  )
  expect(
    await screen.findByText(/Conta usada primeiro \(Anthropic\): Claude da empresa/),
  ).toBeTruthy()
  expect(screen.queryByText(/Pausada/)).toBeNull()
  expect(screen.getByRole('link', { name: 'Mudar a ordem' }).getAttribute('href')).toBe(
    `/companies/${COMPANY.id}/settings/model-accounts`,
  )
})

test('uma recusa fica no campo com a frase do código e o valor escolhido; salvando, o botão fica parado', async () => {
  const hold = Promise.withResolvers<void>()
  const refusals = [refusal('EFFORT_UNSUPPORTED')]
  const { sent } = await open(view(), { mine: () => refusals.shift() })
  await choose(await screen.findByRole('combobox', { name: 'Modelo e raciocínio' }), 'GPT 5')
  fireEvent.click(screen.getByRole('button', { name: SAVED }))
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toContain('nível')
  expect(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }).textContent).toContain(
    'GPT 5',
  )
  server.use(
    http.put(`*/api/companies/${COMPANY.id}/my-model-default`, async () => {
      await hold.promise
      return HttpResponse.json({ mine: { model: GPT, effort: 'off' } })
    }),
  )
  fireEvent.click(screen.getByRole('button', { name: SAVED }))
  const busy = await screen.findByRole('button', { name: 'Salvando…' })
  expect(busy).toHaveProperty('disabled', true)
  hold.resolve()
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Salvando…' })).toBeNull())
  expect(sent).toHaveLength(1)
})

test('sem padrão próprio e com o da empresa pulado: a frase do critério 15 diz por quê', async () => {
  await open(
    view({
      defaults: {
        company: COMPANY_DEFAULT,
        mine: null,
        start: { model: SONNET, effort: 'low', from: 'starter', account: 'Claude da empresa' },
        companyStart: null,
      },
    }),
  )
  expect(
    await screen.findByText(
      'Você não tem conta disponível para OpenAI agora: as conversas novas começam no modelo inicial.',
    ),
  ).toBeTruthy()
  expect(screen.getByText('Você segue o padrão da empresa.')).toBeTruthy()
})

test('com padrão próprio, "Você segue o padrão da empresa." não aparece', async () => {
  await open(
    view({
      defaults: {
        company: null,
        mine: { model: SONNET, effort: 'low' },
        start: { model: SONNET, effort: 'low', from: 'mine', account: 'Claude da empresa' },
        companyStart: null,
      },
    }),
  )
  await screen.findByText(/Uma conversa nova começa em:/)
  expect(screen.queryByText('Você segue o padrão da empresa.')).toBeNull()
})

test('sem padrão próprio e sem o da empresa, "Você segue o padrão da empresa." não aparece', async () => {
  const starter = { model: SONNET, effort: 'low', from: 'starter' as const, account: 'Claude' }
  await open(
    view({ defaults: { company: null, mine: null, start: starter, companyStart: starter } }),
  )
  await screen.findByText(/modelo inicial/)
  expect(screen.queryByText('Você segue o padrão da empresa.')).toBeNull()
})

test('com padrão próprio e com o da empresa também, "Você segue o padrão da empresa." não aparece', async () => {
  await open(
    view({
      defaults: {
        company: COMPANY_DEFAULT,
        mine: { model: SONNET, effort: 'low' },
        start: { model: SONNET, effort: 'low', from: 'mine', account: 'Claude da empresa' },
        companyStart: { ...COMPANY_DEFAULT, from: 'company', account: 'Claude da empresa' },
      },
    }),
  )
  await screen.findByText(/Uma conversa nova começa em:/)
  expect(screen.queryByText('Você segue o padrão da empresa.')).toBeNull()
})

test('o modelo de um nível só não mostra no seletor o nível que ficou salvo', async () => {
  const saved = { model: SONNET, effort: 'medium' }
  const defaults = {
    company: null,
    mine: saved,
    start: { ...saved, from: 'mine' as const, account: 'Minha Claude' },
    companyStart: null,
  }
  await open(
    view({
      defaults,
      choices: {
        mine: [{ id: 'anthropic', name: 'Anthropic', models: [{ id: SONNET, efforts: ['low'] }] }],
        company: [],
      },
    }),
  )
  await screen.findByText(/Uma conversa nova começa em:/)
  expect(screen.queryByText('Médio', { selector: 'span' })).toBeNull()
})
