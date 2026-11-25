import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import {
  conversationOf,
  FIRST,
  onPhone,
  PROJECT,
  SECOND,
  screens,
  view,
} from '../../harness/room/test-hub.tsx'
import { hubServer } from '../../platform/test-hub.tsx'

// Criterion 26 of "Uma sala e os nomes certos" (U13): Renomear in the Construtor de apps' list.
const { open } = screens(hubServer())

function two() {
  return view({
    conversations: [
      conversationOf({ id: FIRST, title: 'Padarias' }),
      conversationOf({ id: SECOND, title: 'Entregas' }),
    ],
  })
}

async function rename(menu: RegExp, title: string) {
  fireEvent.click(await screen.findByRole('button', { name: menu }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Renomear' }))
  fireEvent.change(await screen.findByLabelText('Título da conversa'), { target: { value: title } })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
}

test('no computador, o ⋮ ao lado da lista renomeia a conversa aberta: grava o título, e a lista o mostra', async () => {
  const { sent } = open(two(), `${PROJECT}/conversations/${FIRST}`)
  await rename(/^Ações da conversa: Padarias$/, 'Padarias de bairro')
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Conversas' })).toHaveProperty(
      'value',
      'Padarias de bairro',
    ),
  )
  const puts = sent.filter((one) => one.method === 'PUT')
  expect(puts.map((one) => [one.path, one.body])).toEqual([
    [
      expect.stringMatching(new RegExp(`/sessions/${FIRST}/threads/${FIRST}$`)),
      { title: 'Padarias de bairro' },
    ],
  ])
  expect(screen.queryByRole('menuitem', { name: 'Apagar' })).toBeNull()
})

test('no celular, a lista que sobe de baixo tem o ⋮ em cada linha, e renomear outra conversa não troca a aberta', async () => {
  await onPhone(async () => {
    const { sent, conexus } = open(two(), `${PROJECT}/conversations/${FIRST}`)
    fireEvent.click(await screen.findByRole('button', { name: 'Padarias' }))
    const sheet = await screen.findByRole('dialog', { name: 'Conversas' })
    fireEvent.click(
      await within(sheet).findByRole('button', { name: /^Ações da conversa: Entregas$/ }),
    )
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Renomear' }))
    fireEvent.change(await screen.findByLabelText('Título da conversa'), {
      target: { value: 'Entregas do dia' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    await waitFor(() => expect(sent.some((one) => one.method === 'PUT')).toBe(true))
    expect(sent.find((one) => one.method === 'PUT')?.path).toMatch(
      new RegExp(`/sessions/${SECOND}/threads/${SECOND}$`),
    )
    expect(conexus.router.state.location.pathname).toBe(`${PROJECT}/conversations/${FIRST}`)
  })
})
