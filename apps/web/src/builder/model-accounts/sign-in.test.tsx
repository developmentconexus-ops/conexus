import type { SignInKind } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import type { Answers, View } from './test-hub.tsx'
import { choose, modelHub } from './test-hub.tsx'

const server = hubServer()
const KINDS: SignInKind[] = ['claude_subscription', 'openai_codex']

function open(answers: Answers = {}) {
  const shown: View = { company: [], mine: [], order: [], kinds: KINDS, mayManage: true }
  const hub = modelHub(shown, answers)
  server.use(...hub.handlers)
  render(
    <Conexus
      conexus={createConexus(
        createMemoryHistory({
          initialEntries: [`/companies/${COMPANY.id}/settings/model-accounts`],
        }),
      )}
    />,
  )
  return hub.sent
}

/** The company's "Ligar conta", the page's second: the person's own is above it. */
async function startChatgpt(label: string) {
  const region = await screen.findByRole('region', { name: 'Contas da empresa' })
  fireEvent.click(within(region).getByRole('button', { name: 'Ligar conta' }))
  await screen.findByRole('dialog', { name: 'Ligar conta' })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar com assinatura' }))
  await choose(await screen.findByLabelText('Tipo de assinatura'), 'Assinatura ChatGPT')
  fireEvent.change(screen.getByLabelText('Nome da conta'), { target: { value: label } })
  fireEvent.click(screen.getByRole('button', { name: 'Gerar código' }))
}

test('Assinatura ChatGPT: o código, a página da OpenAI e a espera, sem campo de código; ligada, a janela fecha e a conta entra', async () => {
  const sent = open()
  await startChatgpt('Time GPT')
  expect(await screen.findByText('ABCD-1234')).toBeTruthy()
  const link = screen.getByRole('link', { name: 'Abrir a página da OpenAI' })
  expect(link.getAttribute('href')).toBe('https://auth.example.test/codex/device')
  expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  expect(screen.getByText(/O código vale até/)).toBeTruthy()
  expect(screen.getByRole('status').textContent).toBe('Esperando você digitar o código…')
  expect(screen.queryByRole('textbox')).toBeNull()
  expect(await screen.findByText('Time GPT')).toBeTruthy()
  await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Ligar conta' })).toBeNull())
  expect(sent.map((one) => one.path.split('/').at(-1))).toEqual(['model-account-sign-ins', 'poll'])
})

test('a espera pergunta de novo depois de retryMs enquanto o Hub diz waiting', async () => {
  let asked = 0
  const sent = open({
    poll: async () => {
      asked += 1
      return asked < 3 ? HttpResponse.json({ status: 'waiting', retryMs: 1 }) : undefined
    },
  })
  await startChatgpt('Time GPT')
  expect(await screen.findByText('Time GPT')).toBeTruthy()
  expect(sent.filter((one) => one.path.endsWith('/poll'))).toHaveLength(3)
})

test('Cancelar fica desligado enquanto a espera está no ar e volta depois dela', async () => {
  const held = Promise.withResolvers<void>()
  let asked = 0
  open({
    poll: async () => {
      asked += 1
      if (asked > 1) return undefined
      await held.promise
      return HttpResponse.json({ status: 'waiting', retryMs: 60_000 })
    },
  })
  await startChatgpt('Time GPT')
  const cancel = await screen.findByRole('button', { name: 'Cancelar' })
  await waitFor(() => expect(cancel).toHaveProperty('disabled', true))
  held.resolve()
  await waitFor(() => expect(cancel).toHaveProperty('disabled', false))
})

test('um 502 mantém a espera, diz a frase do Hub e tenta de novo', async () => {
  let asked = 0
  open({
    poll: async () => {
      asked += 1
      return asked === 1 ? refusal('MODEL_ACCOUNT_UNAVAILABLE') : undefined
    },
  })
  await startChatgpt('Time GPT')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O fornecedor não respondeu agora. Entre de novo daqui a pouco.',
  )
  expect(screen.getByText('ABCD-1234')).toBeTruthy()
  expect(await screen.findByText('Time GPT')).toBeTruthy()
})

test('um 502 e depois uma resposta perdida deixam a espera em silêncio', async () => {
  const held = Promise.withResolvers<void>()
  let asked = 0
  open({
    poll: async () => {
      asked += 1
      if (asked === 1) return refusal('MODEL_ACCOUNT_UNAVAILABLE')
      if (asked === 2) return HttpResponse.error()
      return held.promise.then(() => undefined)
    },
  })
  await startChatgpt('Time GPT')
  await screen.findByRole('alert')
  await waitFor(() => expect(asked).toBeGreaterThanOrEqual(3))
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  expect(screen.getByText('ABCD-1234')).toBeTruthy()
  held.resolve()
})

test('a rede fora na espera mantém o código e a espera, e a conta ligada que volta entra', async () => {
  let asked = 0
  const sent = open({
    poll: async () => {
      asked += 1
      return asked === 1 ? HttpResponse.error() : undefined
    },
  })
  await startChatgpt('Time GPT')
  expect(await screen.findByText('Time GPT')).toBeTruthy()
  expect(sent.filter((one) => one.path.endsWith('/poll'))).toHaveLength(2)
})

test('uma espera repetida depois da resposta perdida volta ligada com a mesma conta', async () => {
  let asked = 0
  open({
    poll: async () => {
      asked += 1
      return asked < 3 ? HttpResponse.error() : undefined
    },
  })
  await startChatgpt('Time GPT')
  expect(await screen.findByText('Time GPT')).toBeTruthy()
  expect(screen.queryByText('Algo deu errado dentro do Conexus.', { exact: false })).toBeNull()
})

test('durante a espera o × e as abas ficam desligados, e Cancelar também', async () => {
  const held = Promise.withResolvers<void>()
  let asked = 0
  open({
    poll: async () => {
      asked += 1
      if (asked > 1) return undefined
      await held.promise
      return HttpResponse.json({ status: 'waiting', retryMs: 60_000 })
    },
  })
  await startChatgpt('Time GPT')
  const close = await screen.findByRole('button', { name: 'Fechar' })
  await waitFor(() => expect(close).toHaveProperty('disabled', true))
  expect(screen.getByRole('button', { name: 'Chave de API' })).toHaveProperty('disabled', true)
  fireEvent.keyDown(document.body, { key: 'Escape' })
  expect(screen.getByRole('dialog', { name: 'Ligar conta' })).toBeTruthy()
  held.resolve()
  await waitFor(() => expect(close).toHaveProperty('disabled', false))
})

test('um 500 em toda espera mantém a espera até a hora do código e volta ao começo', async () => {
  open({
    start: () =>
      HttpResponse.json(
        {
          entry: 'device',
          signInId: '00000000-0000-4000-8000-0000000000bb',
          url: 'https://auth.example.test/codex/device',
          userCode: 'ABCD-1234',
          retryMs: 1,
          expiresAt: new Date(Date.now() + 150).toISOString(),
        },
        { status: 201 },
      ),
    poll: async () => refusal('INTERNAL_UNEXPECTED'),
  })
  await startChatgpt('Time GPT')
  expect(await screen.findByText('ABCD-1234')).toBeTruthy()
  expect((await screen.findByRole('alert')).textContent).toBe('O código venceu. Entre de novo.')
  expect(screen.getByRole('button', { name: 'Gerar código' })).toBeTruthy()
})

for (const [code, sentence] of [
  ['MODEL_ACCOUNT_REFUSED', 'O fornecedor recusou a entrada. Entre de novo.'],
  ['MODEL_ACCOUNT_SIGN_IN_EXPIRED', 'O código venceu. Entre de novo.'],
  [
    'MODEL_ACCOUNT_KIND_OFF',
    'Este tipo de conta não está liberado para a empresa. Fale com a Conexus.',
  ],
  ['MODEL_ACCOUNT_SIGN_IN_WRONG_ENTRY', 'Esta entrada não é por aqui. Entre de novo.'],
] as const) {
  test(`${code} na espera: volta ao começo com a frase do Hub`, async () => {
    open({ poll: async () => refusal(code) })
    await startChatgpt('Time GPT')
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe(sentence)
    expect(screen.getByLabelText('Nome da conta')).toHaveProperty('value', 'Time GPT')
    expect(screen.getByRole('button', { name: 'Gerar código' })).toBeTruthy()
    expect(screen.queryByText('ABCD-1234')).toBeNull()
  })
}
