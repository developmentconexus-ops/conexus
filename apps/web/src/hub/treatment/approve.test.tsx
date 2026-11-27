import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { delay } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import {
  bound,
  LIST,
  listOf,
  MODEL_ID,
  modelOf,
  notas,
  openTreatment,
  refused,
  venda,
  version,
} from './test-hub.tsx'

// Ligar: the card with the SQL, the tables it reads and what happens after the yes.
const server = hubServer()
const SQL_TWO = "select nunota, vlrnota\nfrom current.sankhya_notas\nwhere status <> 'C'"
const TWO = version({ number: 2, hash: 'c'.repeat(64), sql: SQL_TWO })
const SQL_THREE = 'select nunota\nfrom tratado.sankhya_notas'
const THREE = version({
  number: 3,
  hash: 'd'.repeat(64),
  sql: SQL_THREE,
  inputs: [{ layer: 'tratado', table: 'sankhya_notas' }],
})
function APPROVE_PATH(number: number): string {
  return `/api/companies/${COMPANY.id}/data/treated/models/${MODEL_ID}/versions/${number}/approve`
}

function waiting(proposal = TWO) {
  return {
    path: `${LIST}/business/${MODEL_ID}`,
    view: {
      list: listOf({ tables: [venda({ active: bound(), proposal })] }),
      models: { [MODEL_ID]: modelOf({ versions: [proposal, bound()] }) },
    },
  }
}

async function openCard() {
  fireEvent.click(await screen.findByRole('button', { name: 'Ligar' }))
  return within(await screen.findByRole('alertdialog', { name: 'Ligar venda v2?' }))
}

test('Ligar abre o cartão com o SQL, as tabelas que ele lê e o que acontece depois', async () => {
  openTreatment(server, waiting())
  const card = await openCard()

  expect(card.getByText('select nunota, vlrnota')).toBeTruthy()
  expect(card.getByText("where status <> 'C'")).toBeTruthy()
  expect(card.getByText('Tabelas que o SQL lê')).toBeTruthy()
  expect(card.getByText('Copiado › sankhya_notas')).toBeTruthy()
  expect(
    card.getByText('A rodada seguinte passa a gravar esta tabela com este SQL. Nada roda agora.'),
  ).toBeTruthy()
})

test('o cartão ocupa a tela abaixo de sm, pelo tamanho page de ui/alert-dialog', async () => {
  openTreatment(server, waiting())
  await openCard()
  const popup = screen.getByRole('alertdialog', { name: 'Ligar venda v2?' })
  expect(popup.getAttribute('data-slot')).toBe('alert-dialog-content')
  expect(popup.classList.contains('inset-0')).toBe(true)
})

test('o cartão nomeia a tabela tratada pelo rótulo, como De onde vem', async () => {
  const held = waiting(version({ ...THREE, number: 2 }))
  held.view.list = listOf({
    tables: [notas(), venda({ active: bound(), proposal: version({ ...THREE, number: 2 }) })],
  })
  openTreatment(server, held)
  const card = await openCard()
  expect(card.getByText('Tratado › Notas')).toBeTruthy()
  expect(card.queryByText('Tratado › sankhya_notas')).toBeNull()
})

test('Ligar no cartão manda o hash que a tela leu e a versão, e fecha o cartão', async () => {
  const { sent } = openTreatment(server, waiting())
  const card = await openCard()

  fireEvent.click(card.getByRole('button', { name: 'Ligar' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(sent).toEqual([{ method: 'POST', path: APPROVE_PATH(2), body: { hash: 'c'.repeat(64) } }])
})

test('Cancelar não pede nada ao Hub', async () => {
  const { sent } = openTreatment(server, waiting())
  const card = await openCard()

  fireEvent.click(card.getByRole('button', { name: 'Cancelar' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(sent).toEqual([])
})

test('a lista de Negócio também liga a proposta, pelo botão da linha', async () => {
  const { sent } = openTreatment(server, { ...waiting(), path: `${LIST}?layer=business` })
  expect(await screen.findByText('Proposta: v2, à espera do sim')).toBeTruthy()
  const card = await openCard()

  fireEvent.click(card.getByRole('button', { name: 'Ligar' }))

  await waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]?.path).toBe(APPROVE_PATH(2))
})

test('com a proposta mudada por Bia, o cartão diz que ela mudou, mostra a nova e liga a nova', async () => {
  const held = openTreatment(server, {
    ...waiting(),
    answers: {
      approve: () => {
        if (held.sent.length > 1) return undefined
        held.view.list = listOf({ tables: [venda({ active: bound(), proposal: THREE })] })
        held.view.models[MODEL_ID] = modelOf({ versions: [THREE, TWO, bound()] })
        return refused('TREATMENT_VERSION_CHANGED')
      },
    },
  })
  const card = await openCard()

  fireEvent.click(card.getByRole('button', { name: 'Ligar' }))

  const changed = within(await screen.findByRole('alertdialog', { name: 'Ligar venda v3?' }))
  expect(
    changed.getByText(
      'A proposta mudou enquanto você lia. Esta é a nova. A rodada seguinte passa a gravar esta tabela com este SQL. Nada roda agora.',
    ),
  ).toBeTruthy()
  expect(changed.getByText('from tratado.sankhya_notas')).toBeTruthy()
  expect(changed.getByText('Tratado › sankhya_notas')).toBeTruthy()
  expect(changed.queryByText("where status <> 'C'")).toBeNull()

  fireEvent.click(changed.getByRole('button', { name: 'Ligar' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(held.sent.map((one) => [one.path, one.body])).toEqual([
    [APPROVE_PATH(2), { hash: 'c'.repeat(64) }],
    [APPROVE_PATH(3), { hash: 'd'.repeat(64) }],
  ])
})

test('uma falha do Hub fica acima dos botões e o cartão não fecha', async () => {
  openTreatment(server, {
    ...waiting(),
    answers: { approve: () => refused('DATABASE_UNAVAILABLE') },
  })
  const card = await openCard()

  fireEvent.click(card.getByRole('button', { name: 'Ligar' }))

  const alert = await card.findByRole('alert')
  expect(alert.textContent).toContain('banco')
  expect(screen.getByRole('alertdialog', { name: 'Ligar venda v2?' })).toBeTruthy()
  expect(card.getByRole('button', { name: 'Ligar' }).hasAttribute('disabled')).toBe(false)
})

test('enquanto liga, o botão do cartão fica ocupado', async () => {
  openTreatment(server, {
    ...waiting(),
    answers: {
      approve: async () => {
        await delay(200)
        return refused('DATABASE_UNAVAILABLE')
      },
    },
  })
  const card = await openCard()

  fireEvent.click(card.getByRole('button', { name: 'Ligar' }))

  expect((await card.findByRole('button', { name: 'Ligando…' })).hasAttribute('disabled')).toBe(
    true,
  )
  await card.findByRole('alert')
})

test('sem proposta à espera não há Ligar', async () => {
  openTreatment(server, {
    path: `${LIST}/business/${MODEL_ID}`,
    view: {
      list: listOf({ tables: [venda({ active: bound() })] }),
      models: { [MODEL_ID]: modelOf({ versions: [bound()] }) },
    },
  })
  expect(await screen.findByRole('button', { name: 'Propor mudança' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Ligar' })).toBeNull()
})

test('quem pode propor mas não ligar não vê Ligar, em Negócio nem na página, e ainda vê Novo tratamento', async () => {
  const held = { ...waiting(), may: { approveTreatment: false } }
  openTreatment(server, { ...held, path: `${LIST}?layer=business` })
  expect(await screen.findByText('Proposta: v2, à espera do sim')).toBeTruthy()
  expect(await screen.findByRole('button', { name: 'Novo tratamento' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Ligar' })).toBeNull()
})

test('quem pode propor mas não ligar vê a proposta na página do tratamento e Propor mudança, sem Ligar', async () => {
  openTreatment(server, { ...waiting(), may: { approveTreatment: false } })
  expect(await screen.findByRole('button', { name: 'Propor mudança' })).toBeTruthy()
  expect(await screen.findByText('Proposta, à espera do sim')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Ligar' })).toBeNull()
})
