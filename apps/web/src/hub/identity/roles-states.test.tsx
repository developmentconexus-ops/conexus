import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { refusal } from '../../platform/test-hub.tsx'
import { ATENDENTE, customRole, FIXED, hub, open, server } from './test-roles.tsx'

const ROLES = `*/api/companies/${COMPANY.id}/roles`

test('o nome do papel tem limite de 40 letras no campo, e a frase o diz', async () => {
  hub({ as: 'owner' })
  open('/settings/roles?new=true')
  const field = await screen.findByLabelText('Nome do papel')
  expect(field.getAttribute('maxlength')).toBe('40')
  fireEvent.click(screen.getByRole('button', { name: 'Criar papel' }))
  expect(await screen.findByText('Escreva o nome do papel, com até 40 letras.')).toBeTruthy()
})

test('um papel apagado aberto pelo endereço: a frase e um caminho de volta a Papéis', async () => {
  hub({ as: 'owner' })
  open('/settings/roles?role=fantasma')
  expect(await screen.findByText('Este papel não existe mais.')).toBeTruthy()
  expect(screen.queryByText(/Confira o endereço/)).toBeNull()
  expect(within(screen.getByRole('main')).getByRole('link', { name: 'Papéis' })).toBeTruthy()
})

test('apagar: o diálogo só fala de convite quando há um, e Apagar fica parado depois da recusa', async () => {
  hub({
    as: 'owner',
    roles: [...FIXED, ATENDENTE],
    people: [
      { personId: 'person-bruno', name: 'Bruno Souza', email: 'b@example.test', role: 'atendente' },
    ],
  })
  server.use(http.delete(`${ROLES}/atendente`, () => refusal('ROLE_IN_USE')))
  open('/settings/roles?role=atendente')
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar papel: Atendente' }))
  const dialog = within(await screen.findByRole('alertdialog'))
  expect(dialog.getByText('Quem tem o papel precisa trocar antes.')).toBeTruthy()
  expect(dialog.queryByText(/convite aberto/i)).toBeNull()
  fireEvent.click(dialog.getByRole('button', { name: 'Apagar papel' }))
  await dialog.findByRole('list', { name: 'Quem usa este papel' })
  await waitFor(() =>
    expect(dialog.getByRole('button', { name: 'Apagar papel' }).hasAttribute('disabled')).toBe(
      true,
    ),
  )
})

test('apagar um papel com convite aberto: o diálogo diz do convite', async () => {
  hub({
    as: 'owner',
    roles: [...FIXED, customRole('Atendente', 'atendente', ['pedidos'])],
    invitationPages: [[{ email: 'dora@example.test', role: 'atendente' }]],
  })
  open('/settings/roles?role=atendente')
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar papel: Atendente' }))
  const dialog = within(await screen.findByRole('alertdialog'))
  expect(await dialog.findByText(/O convite aberto com ele precisa ser cancelado/)).toBeTruthy()
})
