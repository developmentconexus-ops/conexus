import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { assistantScreens, COMPANY_ROOT } from './test-hub.tsx'

// Início of the member: the owner's, without the card that prepares the company (step 24.3.4, criterion 9).
const server = hubServer()
const { at } = assistantScreens(server)

test('o membro vê no Início a caixa do Assistente, as conversas e os Projetos, e não o cartão de preparar a empresa', async () => {
  at(COMPANY_ROOT, { role: 'member' })
  expect(await screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })).toBeTruthy()
  expect(screen.queryByRole('textbox', { name: 'Mensagem para o Builder' })).toBeNull()
  const main = within(screen.getByRole('main'))
  expect(await main.findByRole('region', { name: 'Projetos' })).toBeTruthy()
  expect(screen.queryByRole('region', { name: 'Termine de preparar a empresa' })).toBeNull()
})
