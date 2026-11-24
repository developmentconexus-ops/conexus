import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ConversationMenu } from './conversation-menu.tsx'

async function rename(_title: string) {
  await Promise.resolve()
}

test('sem a ação de apagar, o menu tem Renomear e não tem Apagar', async () => {
  render(<ConversationMenu title="Vendas" actions={{ rename }} />)
  fireEvent.click(screen.getByRole('button', { name: 'Ações da conversa: Vendas' }))
  expect(await screen.findByRole('menuitem', { name: 'Renomear' })).toBeTruthy()
  expect(screen.queryByRole('menuitem', { name: 'Apagar' })).toBeNull()
})

test('sem nenhuma ação, a linha não tem menu', () => {
  render(<ConversationMenu title="Vendas" actions={{}} />)
  expect(screen.queryByRole('button', { name: 'Ações da conversa: Vendas' })).toBeNull()
})
