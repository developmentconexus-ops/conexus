import { ASSISTANT_TOOL } from '@conexus/hub-api'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import { ASKED, COMPANY_ROOT, OFFERED } from './test-hub.tsx'
import { proposalSaid, proposalScreens } from './test-propose.tsx'

// The card's closing round (step 24.3.2, U3): the connections it offers, what a failure locks, what a member sends.
const server = hubServer()
const { handing, mayManage, proposing } = proposalScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`
const IN_PROJECT = `${COMPANY_ROOT}/projects/${PEDIDOS.id}/assistant/${ASKED}`
const proposal = proposalSaid

const NOT_CHOSEN = OFFERED.map((one) => ({ ...one, chosen: false }))

test('uma ligação que a conversa não escolheu não aparece', async () => {
  const [sales, stock] = OFFERED
  if (sales === undefined || stock === undefined) throw new Error('the fixture offers two')
  proposing([proposal()], OPEN, null, [sales, { ...stock, chosen: false }])
  mayManage(true)
  await screen.findByRole('checkbox', { name: 'Vendas' })
  expect(screen.queryByRole('checkbox', { name: 'Estoque' })).toBeNull()
})

test('sem ligação escolhida o cartão pede só o nome, sem caixa nem o título das ligações', async () => {
  proposing([proposal()], OPEN, null, NOT_CHOSEN)
  mayManage(true)
  await screen.findByLabelText('Nome do projeto')
  expect(screen.queryByRole('checkbox')).toBeNull()
  expect(screen.queryByText('Ligações para o app ler')).toBeNull()
})

test('depois de uma falha que deixa o resultado aberto o nome e as caixas ficam travados', async () => {
  handing(() => refusal('HANDOFF_NOT_DELIVERED'))
  proposing()
  mayManage(true)
  fireEvent.change(await screen.findByLabelText('Nome do projeto'), {
    target: { value: 'Encomendas' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Criar app' }))
  await screen.findByRole('button', { name: 'Tentar de novo' })
  expect(screen.getByLabelText('Nome do projeto')).toHaveProperty('disabled', true)
  expect(screen.getByRole('checkbox', { name: 'Vendas' })).toHaveProperty('disabled', true)
})

test('uma falha que liquida deixa o nome livre e o botão com o seu texto, sem Tentar de novo', async () => {
  handing(() => refusal('PROJECT_NAME_TAKEN'))
  proposing()
  mayManage(true)
  fireEvent.change(await screen.findByLabelText('Nome do projeto'), {
    target: { value: 'Encomendas' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Criar app' }))
  await screen.findByRole('alert')
  expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  expect(screen.getByLabelText('Nome do projeto')).toHaveProperty('disabled', false)
})

test('quem não pode liberar manda o pedido sem ligações', async () => {
  const handed = handing()
  proposing()
  mayManage(false)
  fireEvent.change(await screen.findByLabelText('Nome do projeto'), {
    target: { value: 'Encomendas' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Criar app' }))
  await waitFor(() => expect(handed).toHaveLength(1))
  expect(handed[0]?.body).toMatchObject({ connections: [] })
})

test('a leitura da permissão que falha mostra a falha com Tentar de novo, não a frase de pedir ao dono', async () => {
  proposing()
  server.use(
    http.get('*/api/companies/:companyId/connections', () => refusal('DATABASE_UNAVAILABLE')),
  )
  await screen.findByRole('button', { name: 'Tentar de novo' })
  expect(screen.queryByText(/Peça ao dono ou a um administrador/)).toBeNull()
})

test('em um Projeto, se a leitura do Projeto também cai a frase é a da falha, não um silêncio', async () => {
  handing(() => refusal('NOT_FOUND'))
  proposing([proposal(ASSISTANT_TOOL.proposeAppChange)], IN_PROJECT, PEDIDOS.id)
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects/:projectId`, () =>
      refusal('DATABASE_UNAVAILABLE'),
    ),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Mandar ao Builder' }))
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.queryByText('Este Projeto não existe mais.')).toBeNull()
})

test('o nome vazio ou comprido demais diz a frase do nome, e a caixa de marcar tem a cor da marca', async () => {
  proposing()
  mayManage(true)
  expect(await screen.findByText('Escreva o nome do Projeto, com até 100 caracteres.')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Nome do projeto'), { target: { value: 'Encomendas' } })
  expect(screen.queryByText(/Escreva o nome do Projeto/)).toBeNull()
  fireEvent.change(screen.getByLabelText('Nome do projeto'), { target: { value: 'x'.repeat(101) } })
  expect(screen.getByText(/Escreva o nome do Projeto/)).toBeTruthy()
  const box = await screen.findByRole('checkbox', { name: 'Vendas' })
  expect(box.className).toContain('accent-accent')
})
