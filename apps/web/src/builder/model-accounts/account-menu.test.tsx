import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import type { Answers, View } from './test-hub.tsx'
import { accountOf, modelHub, pickFromMenu } from './test-hub.tsx'

const server = hubServer()
const PAGE = `/companies/${COMPANY.id}/settings/model-accounts`

function view(fields: Partial<View> = {}): View {
  return {
    company: [],
    mine: [],
    order: [],
    kinds: [],
    mayManage: true,
    ...fields,
  }
}

function open(shown: View, answers: Answers = {}, path = PAGE) {
  const hub = modelHub(shown, answers)
  server.use(...hub.handlers)
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return { ...hub, router: conexus.router }
}

/**
 * The item once it can be pressed: a write stays pending until its reads come back
 * (`platform/cache.ts`), so the new word shows a moment before the menu is enabled.
 */
async function pickWhenFree(label: string, item: string) {
  const trigger = await screen.findByRole('button', { name: `Mais ações para ${label}` })
  fireEvent.click(trigger)
  const entry = await screen.findByRole('menuitem', { name: item })
  await waitFor(() => expect(entry.hasAttribute('data-disabled')).toBe(false))
  fireEvent.click(entry)
}

test('as ações no menu: Renomear, Pausar, Dar a pessoas… e, separado, Remover…', async () => {
  open(view({ company: [accountOf({ label: 'Time 1' })] }))
  fireEvent.click(await screen.findByRole('button', { name: 'Mais ações para Time 1' }))
  const items = await screen.findAllByRole('menuitem')
  expect(items.map((one) => one.textContent)).toEqual([
    'Renomear',
    'Pausar',
    'Dar a pessoas…',
    'Remover…',
  ])
  expect(items[3]?.className).toContain('text-danger')
  expect(screen.getAllByRole('separator')).toHaveLength(1)
})

test('Pausar e Retomar mandam a revisão lida e a conta muda de palavra', async () => {
  const { sent } = open(view({ company: [accountOf({ label: 'Time 1' })] }))
  await pickWhenFree('Time 1', 'Pausar')
  expect(await screen.findByText('pausada')).toBeTruthy()
  await pickWhenFree('Time 1', 'Retomar')
  expect(await screen.findByText('ligada')).toBeTruthy()
  expect(sent.map((one) => one.body)).toEqual([
    { revision: 0, state: 'paused' },
    { revision: 1, state: 'ready' },
  ])
})

test('uma conta recusada não tem Retomar nem Pausar no menu', async () => {
  open(view({ company: [accountOf({ label: 'Time 4', state: 'refused' })] }))
  fireEvent.click(await screen.findByRole('button', { name: 'Mais ações para Time 4' }))
  await screen.findAllByRole('menuitem')
  expect(screen.queryByRole('menuitem', { name: 'Pausar' })).toBeNull()
  expect(screen.queryByRole('menuitem', { name: 'Retomar' })).toBeNull()
})

test('Pausar recusado diz o porquê embaixo da linha, com o papel de alerta, e a conta é lida de novo', async () => {
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
  await pickFromMenu('Time 1', 'Pausar')
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toBe('Esta conta mudou. Recarregue a página.')
  expect(alert.closest('tr')?.previousElementSibling?.textContent).toContain('Time 1')
  expect(await screen.findByText('Time 1 de outra aba')).toBeTruthy()
})

test('Renomear: o campo toma o foco, manda o nome e a revisão e o foco volta ao …; Esc cancela', async () => {
  const { sent } = open(view({ company: [accountOf({ label: 'Time 1' })] }))
  await pickFromMenu('Time 1', 'Renomear')
  const field = await screen.findByLabelText('Novo nome de Time 1')
  await waitFor(() => expect(document.activeElement).toBe(field))
  fireEvent.keyDown(field, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByLabelText('Novo nome de Time 1')).toBeNull())
  const more = screen.getByRole('button', { name: 'Mais ações para Time 1' })
  expect(document.activeElement).toBe(more)

  await pickFromMenu('Time 1', 'Renomear')
  fireEvent.change(await screen.findByLabelText('Novo nome de Time 1'), {
    target: { value: 'Equipe 1' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar nome' }))
  const renamed = await screen.findByRole('button', { name: 'Mais ações para Equipe 1' })
  await waitFor(() => expect(document.activeElement).toBe(renamed))
  expect(sent.map((one) => one.body)).toEqual([{ revision: 0, label: 'Equipe 1' }])
})

test('Dar a pessoas manda a lista final; sem ninguém marcada a conta volta a ser para todos', async () => {
  const { sent } = open(view({ company: [accountOf({ label: 'Time 1' })] }))
  await pickFromMenu('Time 1', 'Dar a pessoas…')
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Diego' }))
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('chave …x7Qa · reservada para Diego')).toBeTruthy()
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())

  await pickFromMenu('Time 1', 'Dar a pessoas…')
  const again = await screen.findByRole('alertdialog')
  expect(within(again).getByRole('checkbox', { name: 'Diego' })).toHaveProperty('checked', true)
  fireEvent.click(within(again).getByRole('checkbox', { name: 'Diego' }))
  fireEvent.click(within(again).getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('chave …x7Qa')).toBeTruthy()
  expect(sent.map((one) => one.body)).toEqual([{ personIds: ['person-diego'] }, { personIds: [] }])
})

test('Remover: o aviso do Console, Esc devolve o foco ao …, e a confirmação apaga a conta e leva o foco à parte da página', async () => {
  const { sent } = open(view({ company: [accountOf({ label: 'Time 1' })] }))
  await pickFromMenu('Time 1', 'Remover…')
  const dialog = await screen.findByRole('alertdialog', { name: 'Remover Time 1?' })
  expect(within(dialog).getByText(/Apague também a chave no Console da Anthropic\./)).toBeTruthy()
  fireEvent.keyDown(dialog, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Mais ações para Time 1' }),
    ),
  )

  await pickFromMenu('Time 1', 'Remover…')
  fireEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Remover conta' }),
  )
  expect(await screen.findByText('Nenhuma conta ligada')).toBeTruthy()
  expect(sent.map((one) => one.method)).toEqual(['DELETE'])
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('region', { name: 'Contas da empresa' })),
  )
})

test('Dar a pessoas lê todas as páginas: a pessoa 51 aparece pelo nome e pode receber a conta', async () => {
  const { sent } = open(view({ company: [accountOf({ label: 'Time 1' })], crowd: 49 }))
  await pickFromMenu('Time 1', 'Dar a pessoas…')
  const dialog = await screen.findByRole('alertdialog')
  expect(within(dialog).getAllByRole('checkbox')).toHaveLength(51)
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Pessoa 49' }))
  fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('chave …x7Qa · reservada para Pessoa 49')).toBeTruthy()
  expect(sent.map((one) => one.body)).toEqual([{ personIds: ['person-extra-49'] }])
})
