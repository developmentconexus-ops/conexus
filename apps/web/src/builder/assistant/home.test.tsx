import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { assistantConversation, assistantScreens, COMPANY_ROOT, STOCK } from './test-hub.tsx'

// Início of the owner: the Assistant's box, its bar and the recent conversations (step 24.1, criteria 23 and 23a).
const server = hubServer()
const { at } = assistantScreens(server)

async function box() {
  return screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
}

test('o dono vê a caixa do Assistente com as ligações todas escolhidas', async () => {
  at(COMPANY_ROOT)
  expect(await screen.findByRole('heading', { name: 'Pergunte ou peça um app' })).toBeTruthy()
  const bar = await screen.findByRole('group', { name: 'Ligações da conversa' })
  await waitFor(() => expect(within(bar).getByText('Sankhya · Vendas')).toBeTruthy())
  expect(within(bar).getByText('Sankhya · Estoque')).toBeTruthy()
  expect(await box()).toBeTruthy()
})

test('perguntar cria a conversa com as ligações da barra e abre o chat com a pergunta enviada uma vez', async () => {
  const { writes, conexus } = at(COMPANY_ROOT)
  const bar = await screen.findByRole('group', { name: 'Ligações da conversa' })
  await waitFor(() => expect(within(bar).getByText('Sankhya · Estoque')).toBeTruthy())
  fireEvent.click(within(bar).getByRole('button', { name: 'Ajustar' }))
  fireEvent.click(await screen.findByRole('switch', { name: 'Sankhya · Estoque' }))
  expect(within(bar).queryByText('Sankhya · Estoque')).toBeNull()
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
  fireEvent.change(await box(), { target: { value: 'Como foram as vendas?' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toMatch(
      new RegExp(`${COMPANY_ROOT}/conversations/`),
    ),
  )
  const [created] = writes()
  expect(created?.path).toMatch(/assistant\/conversations$/)
  expect(created?.body).toMatchObject({ connections: [expect.not.stringContaining(STOCK)] })
  expect(created?.key).not.toBeNull()
  await waitFor(() =>
    expect(writes().filter((one) => one.path.endsWith('/messages'))).toHaveLength(1),
  )
})

test('as conversas recentes aparecem e abrem a conversa', async () => {
  const { conexus } = at(COMPANY_ROOT, { conversations: [assistantConversation()] })
  const link = await screen.findByRole('link', { name: /Vendas da semana/ })
  fireEvent.click(link)
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toMatch(/\/conversations\/3{8}-/),
  )
})
