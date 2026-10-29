import { changeMemberRole, getCompany, listInvitations, listMembers } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { hubServer, memberView, refusal, sessionRead } from '../../platform/test-hub.tsx'
import { COMPANY_ACCESS_NONE } from '../../platform/test-hub-access.tsx'

const server = hubServer()

const DAVI = { personId: 'person-davi', name: 'Davi Costa', email: 'davi@example.test' }
const UNCONFIRMED = 'Não confirmamos a mudança. Veja a lista.'

/**
 * Ana, owner with Davi, a member she may promote or take out; she may also leave. Every write is
 * recorded, the people list is read again from `members` after a 204 or a 200.
 */
function hub(answers: { remove?: () => Response; change?: () => Response } = {}) {
  const members = [
    memberView({
      ...ANA,
      personId: ANA.id,
      role: 'owner',
      mayRemove: true,
      mayChangeTo: ['admin', 'member'],
      invitationsSent: 2,
    }),
    memberView({
      ...DAVI,
      role: 'member',
      mayRemove: true,
      mayChangeTo: ['owner', 'admin'],
      invitationsSent: 1,
    }),
  ]
  const writes: { method: string; url: string; body?: unknown }[] = []
  server.use(
    sessionRead(() => ANA),
    COMPANY_ACCESS_NONE,
    http.get(`*/api/companies/${COMPANY.id}`, () =>
      HttpResponse.json(
        getCompany.success.body.parse({
          company: COMPANY,
          role: 'owner',
          mayInviteAs: [],
        }),
      ),
    ),
    http.get(`*/api/companies/${COMPANY.id}/members`, () =>
      HttpResponse.json(listMembers.success.body.parse({ members, next: { kind: 'END' } })),
    ),
    http.get(`*/api/companies/${COMPANY.id}/invitations`, () =>
      HttpResponse.json(
        listInvitations.success.body.parse({ invitations: [], next: { kind: 'END' } }),
      ),
    ),
    http.delete(`*/api/companies/${COMPANY.id}/members/:personId`, ({ request, params }) => {
      writes.push({ method: 'DELETE', url: String(params.personId) })
      void request
      return (answers.remove ?? (() => new HttpResponse(null, { status: 204 })))()
    }),
    http.put(`*/api/companies/${COMPANY.id}/members/:personId`, async ({ request, params }) => {
      writes.push({ method: 'PUT', url: String(params.personId), body: await request.json() })
      return (
        answers.change ??
        (() =>
          HttpResponse.json(
            changeMemberRole.success.body.parse({ member: { ...members[1], role: 'admin' } }),
          ))
      )()
    }),
  )
  return { writes }
}

async function pickAdmin() {
  fireEvent.click(await screen.findByLabelText('Papel'))
  const option = await screen.findByRole('option', { name: 'Administrador' })
  for (const event of [
    fireEvent.pointerDown,
    fireEvent.mouseDown,
    fireEvent.pointerUp,
    fireEvent.mouseUp,
    fireEvent.click,
  ]) {
    event(option)
  }
}

async function confirmLeaving() {
  fireEvent.click(await screen.findByRole('button', { name: 'Sair da empresa' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Sair da empresa' }))
}

function open() {
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}/settings/people`] }),
  )
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

test('cada linha oferece só o que o Hub diz: Davi pode mudar e sair; Ana, a dona, "Sair da empresa"', async () => {
  hub()
  open()
  for (const name of [
    'Mudar papel: Davi Costa',
    'Tirar da empresa: Davi Costa',
    'Sair da empresa',
  ]) {
    expect(await screen.findByRole('button', { name })).toBeTruthy()
  }
})

test('tirar: a confirmação diz que a conta continua e quantos convites cancelam; confirmar manda o DELETE', async () => {
  const { writes } = hub()
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Tirar da empresa: Davi Costa' }))
  const dialog = await screen.findByRole('alertdialog')
  expect(dialog.textContent).toContain('Tirar Davi Costa de Empresa Teste?')
  expect(dialog.textContent).toContain(
    'Perde o acesso agora. A conta continua. O convite que Davi Costa enviou será cancelado.',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Tirar da empresa' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(writes).toEqual([{ method: 'DELETE', url: DAVI.personId }])
})

test('mudar papel: a lista traz o atual e os que o Hub oferece, e o PUT leva o papel lido', async () => {
  const { writes } = hub()
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Mudar papel: Davi Costa' }))
  expect((await screen.findByRole('alertdialog')).textContent).toContain('Papel atual: Membro.')
  expect(screen.getByRole('button', { name: 'Mudar papel' })).toHaveProperty('disabled', true)
  await pickAdmin()
  fireEvent.click(screen.getByRole('button', { name: 'Mudar papel' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(writes).toEqual([
    { method: 'PUT', url: DAVI.personId, body: { role: 'admin', from: 'member' } },
  ])
})

test('recusa nomeada: a frase do Hub no diálogo, que fica aberto', async () => {
  hub({ change: () => refusal('MEMBER_STALE') })
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Mudar papel: Davi Costa' }))
  await pickAdmin()
  fireEvent.click(screen.getByRole('button', { name: 'Mudar papel' }))
  expect(await screen.findByText(/Esta pessoa mudou de papel enquanto você olhava\./)).toBeTruthy()
  expect(screen.getByRole('alertdialog')).toBeTruthy()
})

test('resposta que não se confirma: a frase de não confirmado, nunca a do Hub', async () => {
  hub({ remove: () => refusal('DATABASE_UNAVAILABLE') })
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Tirar da empresa: Davi Costa' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Tirar da empresa' }))
  expect(await screen.findByText(UNCONFIRMED)).toBeTruthy()
})

test('sair: a dona sai, a página da empresa vai embora e a tela inicial abre', async () => {
  const { writes } = hub()
  const router = open()
  fireEvent.click(await screen.findByRole('button', { name: 'Sair da empresa' }))
  expect((await screen.findByRole('alertdialog')).textContent).toContain('Sair de Empresa Teste?')
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Sair da empresa' }))
  await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  expect(writes).toEqual([{ method: 'DELETE', url: ANA.id }])
})

test('o último dono: a recusa LAST_OWNER diz a frase e a ação no diálogo', async () => {
  hub({ remove: () => refusal('LAST_OWNER') })
  open()
  await confirmLeaving()
  expect(await screen.findByText(/A empresa precisa de pelo menos um dono\./)).toBeTruthy()
})
