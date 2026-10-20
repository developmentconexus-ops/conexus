import { FAILURES, listInvitations } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import type { Answers, View } from './test-hub.tsx'
import { choose, modelHub } from './test-hub.tsx'

const server = hubServer()
const KEY = 'sk-segredo-plantado-9f3A'

function open(kinds: View['kinds'], answers: Answers = {}) {
  const hub = modelHub(
    { company: [], mine: [], order: [], kinds, defaultModel: null, mayManage: true },
    answers,
  )
  server.use(
    ...hub.handlers,
    http.get(`*/api/companies/${COMPANY.id}/invitations`, () =>
      HttpResponse.json(
        listInvitations.success.body.parse({ invitations: [], next: { kind: 'END' } }),
      ),
    ),
  )
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}/welcome/model-account`] }),
  )
  render(<Conexus conexus={conexus} />)
  return hub.sent
}

async function openPanel() {
  fireEvent.click(await screen.findByRole('button', { name: 'Ligar conta' }))
  return screen.findByRole('region', { name: 'Ligar conta' })
}

async function fillKey() {
  fireEvent.change(screen.getByLabelText('Buscar fornecedor'), { target: { value: 'mist' } })
  await choose(screen.getByLabelText('Fornecedor'), 'Mistral')
  fireEvent.change(screen.getByLabelText('Nome da conta'), { target: { value: 'Time 3' } })
  fireEvent.change(screen.getByLabelText('Chave de API'), { target: { value: KEY } })
}

test('Passo 2, chave de API: ligada uma conta, o botão passa a Continuar e leva ao Passo 3', async () => {
  const sent = open([])
  await openPanel()
  await fillKey()
  fireEvent.click(screen.getByRole('button', { name: 'Ligar conta' }))
  expect(await screen.findByText('Time 3 · chave …9f3A · ligada')).toBeTruthy()
  expect(sent[0]?.body).toMatchObject({ owner: 'company', provider: 'mistral', label: 'Time 3' })
  fireEvent.click(await screen.findByRole('link', { name: 'Continuar' }))
  expect(await screen.findByRole('heading', { name: 'Convide sua equipe' })).toBeTruthy()
})

test('Passo 2, recusa da chave: a frase no campo e nenhuma conta ligada', async () => {
  open([], { connect: () => refusal('MODEL_ACCOUNT_INVALID') })
  await openPanel()
  await fillKey()
  fireEvent.click(screen.getByRole('button', { name: 'Ligar conta' }))
  expect(
    (await screen.findByText(FAILURES.MODEL_ACCOUNT_INVALID.phrase)).getAttribute('role'),
  ).toBe('alert')
  await waitFor(() =>
    expect(screen.getByLabelText('Chave de API').getAttribute('aria-invalid')).toBe('true'),
  )
  expect(screen.queryByRole('link', { name: 'Continuar' })).toBeNull()
})

test('Passo 2, assinatura Claude: o código troca por uma conta ligada e aparece Continuar', async () => {
  open(['claude_subscription'])
  await openPanel()
  fireEvent.click(screen.getByRole('button', { name: 'Entrar com assinatura' }))
  fireEvent.change(await screen.findByLabelText('Nome da conta'), { target: { value: 'Time 2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Gerar endereço de entrada' }))
  fireEvent.change(await screen.findByLabelText('Código da Anthropic'), {
    target: { value: 'abc#def' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText('Time 2 · Assinatura Claude · ligada')).toBeTruthy()
  expect(await screen.findByRole('link', { name: 'Continuar' })).toBeTruthy()
})

test('Passo 2, assinatura Google: o campo pede o endereço de retorno inteiro', async () => {
  open(['claude_subscription', 'google_cliproxy'])
  await openPanel()
  fireEvent.click(screen.getByRole('button', { name: 'Entrar com assinatura' }))
  await choose(await screen.findByLabelText('Tipo de assinatura'), 'Google')
  fireEvent.change(screen.getByLabelText('Nome da conta'), { target: { value: 'Time G' } })
  fireEvent.click(screen.getByRole('button', { name: 'Gerar endereço de entrada' }))
  fireEvent.change(await screen.findByLabelText('Endereço de retorno do Google'), {
    target: { value: 'http://localhost:51121/oauth-callback?state=abc&code=xyz' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText('Time G · Google · ligada')).toBeTruthy()
  expect(await screen.findByRole('link', { name: 'Continuar' })).toBeTruthy()
})
