import { PersonId } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import type { Answers, View } from './test-hub.tsx'
import { accountOf, modelHub } from './test-hub.tsx'

const server = hubServer()
const SETUP = `/companies/${COMPANY.id}/setup`
const ORDER = `/api/companies/${COMPANY.id}/model-account-orders/company/anthropic`

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

function open(shown: View, answers: Answers = {}, path = SETUP) {
  const hub = modelHub(shown, answers)
  server.use(...hub.handlers)
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return { ...hub, router: conexus.router }
}

/** Four Anthropic accounts in a queue, A to D. */
function queue() {
  return ['A', 'B', 'C', 'D'].map((label, position) => accountOf({ label, position }))
}

function labelsInOrder() {
  return screen
    .getAllByRole('listitem')
    .map((row) => row.textContent?.slice(0, 1))
    .filter((first) => first && 'ABCD'.includes(first))
}

test('Configurar a empresa com apelido abre a Conta de modelo, sem o campo do apelido', async () => {
  const { router } = open(view())
  expect(await screen.findByRole('heading', { name: 'Conta de modelo' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Configurar a empresa' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(SETUP)
  expect(screen.queryByLabelText('Apelido')).toBeNull()
})

test('vazio: "Nenhuma conta ligada" e Ligar conta, para quem pode', async () => {
  open(view())
  expect(await screen.findByText('Nenhuma conta ligada')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Ligar conta' })).toBeTruthy()
})

test('quem só lê vê as contas, sem ação nem Ligar conta nem o modelo para escolher', async () => {
  open(view({ company: queue(), mayManage: false, defaultModel: 'anthropic/claude-sonnet-4' }))
  expect(await screen.findByText('Modelo padrão: anthropic/claude-sonnet-4')).toBeTruthy()
  expect(screen.getAllByText(/chave …x7Qa · ligada · para todos/)).toHaveLength(4)
  for (const name of [
    /^Pausar/,
    /^Renomear/,
    /^Remover/,
    /^Subir/,
    /^Descer/,
    /^Dar /,
    'Ligar conta',
  ]) {
    expect(screen.queryByRole('button', { name })).toBeNull()
  }
  expect(screen.queryByLabelText('Modelo padrão')).toBeNull()
})

test('cada conta diz o estado em palavras: para todos, reservada, pausada, recusada, desligada', async () => {
  open(
    view({
      company: [
        accountOf({ label: 'Time 1', position: 0 }),
        accountOf({
          label: 'Time 2',
          position: 1,
          assignees: [PersonId.parse(ANA.id), PersonId.parse('person-diego')],
        }),
        accountOf({ label: 'Time 3', position: 2, state: 'paused' }),
        accountOf({ label: 'Time 4', position: 3, state: 'refused' }),
        accountOf({
          label: 'Time 5',
          position: 4,
          kind: 'claude_subscription',
          hint: null,
          kindOff: true,
        }),
      ],
    }),
  )
  expect(await screen.findByRole('heading', { name: 'Anthropic' })).toBeTruthy()
  expect(screen.getByText('chave …x7Qa · ligada · para todos')).toBeTruthy()
  expect(screen.getByText('chave …x7Qa · ligada · reservada para Ana Lima, Diego')).toBeTruthy()
  expect(screen.getByText('chave …x7Qa · pausada · para todos')).toBeTruthy()
  expect(screen.getByText('chave …x7Qa · recusada · Ligue de novo · para todos')).toBeTruthy()
  expect(screen.getByText('Assinatura Claude · desligada pela Conexus · para todos')).toBeTruthy()
  // A refused account is linked again, not resumed.
  expect(screen.queryByRole('button', { name: 'Pausar Time 4' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Retomar Time 4' })).toBeNull()
  expect(screen.getByRole('button', { name: 'Retomar Time 3' })).toBeTruthy()
})

test('Pausar e Retomar mandam a revisão lida e a conta muda de palavra', async () => {
  const { sent } = open(view({ company: [accountOf({ label: 'Time 1' })] }))
  fireEvent.click(await screen.findByRole('button', { name: 'Pausar Time 1' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Retomar Time 1' }))
  expect(await screen.findByRole('button', { name: 'Pausar Time 1' })).toBeTruthy()
  expect(sent.map((one) => one.body)).toEqual([
    { revision: 0, state: 'paused' },
    { revision: 1, state: 'ready' },
  ])
})

test('412: a frase da falha na linha, e a conta é lida de novo', async () => {
  const shown = view({ company: [accountOf({ label: 'Time 1' })] })
  open(shown, {
    change: () => {
      shown.company = shown.company.map((one) => ({
        ...one,
        label: 'Time 1 de outra aba',
        revision: 5,
      }))
      return refusal('MODEL_ACCOUNT_STALE')
    },
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Pausar Time 1' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Esta conta mudou. Recarregue a página.',
  )
  expect(await screen.findByText('Time 1 de outra aba')).toBeTruthy()
})

test('Renomear: o campo toma o foco, manda o nome e a revisão e o foco volta ao botão; Esc cancela', async () => {
  const { sent } = open(view({ company: [accountOf({ label: 'Time 1' })] }))
  fireEvent.click(await screen.findByRole('button', { name: 'Renomear Time 1' }))
  const field = await screen.findByLabelText('Novo nome de Time 1')
  await waitFor(() => expect(document.activeElement).toBe(field))
  fireEvent.keyDown(field, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByLabelText('Novo nome de Time 1')).toBeNull())
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Renomear Time 1' }))

  fireEvent.click(screen.getByRole('button', { name: 'Renomear Time 1' }))
  fireEvent.change(await screen.findByLabelText('Novo nome de Time 1'), {
    target: { value: 'Equipe 1' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar nome' }))
  const renamed = await screen.findByRole('button', { name: 'Renomear Equipe 1' })
  await waitFor(() => expect(document.activeElement).toBe(renamed))
  expect(sent.map((one) => one.body)).toEqual([{ revision: 0, label: 'Equipe 1' }])
})

test('Subir e Descer só onde a conta se move, com a ordem inteira da fila e o foco no botão usado', async () => {
  const accounts = queue()
  const { sent } = open(view({ company: accounts }))
  await screen.findByRole('button', { name: 'Descer A' })
  expect(screen.queryByRole('button', { name: 'Subir A' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Descer D' })).toBeNull()
  const [a, b, c, d] = accounts.map((one) => one.id)

  const up = screen.getByRole('button', { name: 'Subir C' })
  up.focus()
  fireEvent.click(up)
  await waitFor(() => expect(labelsInOrder()).toEqual(['A', 'C', 'B', 'D']))
  expect(sent[0]).toMatchObject({ method: 'PUT', path: ORDER, body: { ids: [a, c, b, d] } })
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Subir C' })),
  )
  expect((await screen.findByText('C agora é a 2ª da fila Anthropic.')).getAttribute('role')).toBe(
    'status',
  )

  // At the top the row has no "Subir": focus goes to its "Descer".
  fireEvent.click(screen.getByRole('button', { name: 'Subir C' }))
  await waitFor(() => expect(labelsInOrder()).toEqual(['C', 'A', 'B', 'D']))
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Descer C' })),
  )
})

test('409: a frase da falha, e a fila é lida de novo na ordem que ficou', async () => {
  const accounts = queue()
  const shown = view({ company: accounts })
  open(shown, {
    order: () => {
      shown.company = accounts.map((one, position) => ({ ...one, position: 3 - position }))
      return refusal('MODEL_ACCOUNT_ORDER_STALE')
    },
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Subir B' }))
  expect((await screen.findByText(/A fila mudou enquanto você a ordenava/)).textContent).toBe(
    'A fila mudou enquanto você a ordenava. Recarregue a página.',
  )
  await waitFor(() => expect(labelsInOrder()).toEqual(['D', 'C', 'B', 'A']))
})

test('Dar a pessoas manda a lista final; sem ninguém marcada a conta volta a ser para todos', async () => {
  const { sent } = open(view({ company: [accountOf({ label: 'Time 1' })] }))
  fireEvent.click(await screen.findByRole('button', { name: 'Dar Time 1 a pessoas' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Diego' }))
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('chave …x7Qa · ligada · reservada para Diego')).toBeTruthy()
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())

  fireEvent.click(screen.getByRole('button', { name: 'Dar Time 1 a pessoas' }))
  const again = await screen.findByRole('alertdialog')
  expect(within(again).getByRole('checkbox', { name: 'Diego' })).toHaveProperty('checked', true)
  fireEvent.click(within(again).getByRole('checkbox', { name: 'Diego' }))
  fireEvent.click(within(again).getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('chave …x7Qa · ligada · para todos')).toBeTruthy()
  expect(sent.map((one) => one.body)).toEqual([{ personIds: ['person-diego'] }, { personIds: [] }])
})

test('Remover: o aviso do Console, Esc devolve o foco, e a confirmação apaga a conta', async () => {
  const { sent } = open(view({ company: [accountOf({ label: 'Time 1' })] }))
  const trigger = await screen.findByRole('button', { name: 'Remover Time 1' })
  fireEvent.click(trigger)
  const dialog = await screen.findByRole('alertdialog', { name: 'Remover Time 1?' })
  expect(within(dialog).getByText(/Apague também a chave no Console da Anthropic\./)).toBeTruthy()
  fireEvent.keyDown(dialog, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  await waitFor(() => expect(document.activeElement).toBe(trigger))

  fireEvent.click(trigger)
  fireEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Remover conta' }),
  )
  expect(await screen.findByText('Nenhuma conta ligada')).toBeTruthy()
  expect(sent.map((one) => one.method)).toEqual(['DELETE'])
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Conta de modelo' })),
  )
})

test('Modelo padrão: qualquer modelo do registro, como fornecedor/modelo; fora da lista, a frase da falha', async () => {
  const shown = view()
  const { sent } = open(shown, {
    default: () => (sent.length === 1 ? refusal('MODEL_UNKNOWN') : undefined),
  })
  const field = await screen.findByLabelText('Modelo padrão')
  const save = screen.getByRole('button', { name: 'Salvar modelo padrão' })
  expect(save).toHaveProperty('disabled', true)
  fireEvent.change(field, { target: { value: 'openai/gpt-5' } })
  fireEvent.click(save)
  expect((await screen.findByRole('alert')).textContent).toBe('Este modelo não está na lista.')
  fireEvent.click(screen.getByRole('button', { name: 'Salvar modelo padrão' }))
  await waitFor(() => expect(shown.defaultModel).toBe('openai/gpt-5'))
  expect(sent.map((one) => one.body)).toEqual([
    { model: 'openai/gpt-5' },
    { model: 'openai/gpt-5' },
  ])
})
