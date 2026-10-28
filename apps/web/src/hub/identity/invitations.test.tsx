import { cancelInvitation, createInvitation, renewInvitation } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { refusal } from '../../platform/test-hub.tsx'
import { bodyRows, EXPIRED, hub, open, PENDING, sectionOf, server } from './test-people.tsx'

test('sem convites pendentes: a frase "Nenhum convite pendente."', async () => {
  hub({ role: 'owner', mayInviteAs: ['admin'], invitations: [] })
  open()
  const pending = within(
    sectionOf(await screen.findByRole('heading', { name: 'Convites pendentes' })),
  )
  expect(pending.getByText('Nenhum convite pendente.')).toBeTruthy()
  expect(pending.queryAllByRole('table')).toEqual([])
})

test('convites: o vivo diz "Vence em" com dia e hora no fuso de quem lê; o vencido diz "Vencido" e oferece "Convidar de novo"', async () => {
  hub({ role: 'owner', mayInviteAs: ['admin', 'member'], invitations: [PENDING, EXPIRED] })
  open()
  const pending = within(
    sectionOf(await screen.findByRole('heading', { name: 'Convites pendentes' })),
  )
  expect(bodyRows(pending).map((row) => row.textContent)).toEqual([
    'bia@example.testVence em 17/10/2026, 09:00AdministradorReenviarCancelar',
    'eva@example.testVencidoMembroReenviarCancelar',
  ])
  expect(pending.getAllByRole('button').map((button) => button.textContent)).toEqual([
    'Reenviar',
    'Cancelar',
    'Reenviar',
    'Cancelar',
  ])
})

test('"Convidar de novo" manda o mesmo e-mail e papel com uma chave de tentativa, e a lista é lida de novo', async () => {
  const { reads, sent } = hub({
    role: 'owner',
    mayInviteAs: ['admin', 'member'],
    invitations: [EXPIRED],
    answer: () =>
      HttpResponse.json(
        createInvitation.success.body.parse({
          invitation: {
            ...EXPIRED,
            state: 'PENDING',
            id: 'n'.repeat(32),
            expiresAt: '2026-10-18T12:00:00.000Z',
          },
        }),
        { status: 201 },
      ),
  })
  open()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Reenviar convite para eva@example.test' }),
  )
  // The two lists are read side by side, in no set order: each is read once more after the send.
  await waitFor(() => expect(reads.length).toBe(4))
  expect([reads.slice(0, 2).sort(), reads.slice(2).sort()]).toEqual([
    ['invitations', 'members'],
    ['invitations', 'members'],
  ])
  expect(sent.map(({ body }) => body)).toEqual([
    { email: 'eva@example.test', role: 'member', replaces: { id: EXPIRED.id, revision: 0 } },
  ])
  expect(sent[0]?.key).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  )
})

test('"Convidar de novo" recusado: a frase da recusa na linha do convite', async () => {
  hub({
    role: 'owner',
    mayInviteAs: ['admin', 'member'],
    invitations: [EXPIRED],
    answer: () => refusal('MEMBER_EXISTS'),
  })
  open()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Reenviar convite para eva@example.test' }),
  )
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toBe('Essa pessoa já está na empresa.')
  // The refusal stands in the row right under the invitation it belongs to.
  expect(alert.closest('tr')?.previousElementSibling?.textContent).toContain('eva@example.test')
})

test('live invitation renews with its revision; cancellation requires the exact email and preserves a refusal', async () => {
  const calls: unknown[] = []
  hub({ role: 'owner', mayInviteAs: ['admin'], invitations: [PENDING] })
  server.use(
    http.put(`*/api/companies/${COMPANY.id}/invitations/${PENDING.id}`, async ({ request }) => {
      calls.push(renewInvitation.input.body.parse(await request.json()))
      return HttpResponse.json(
        renewInvitation.success.body.parse({ invitation: { ...PENDING, revision: 1 } }),
      )
    }),
    http.delete(`*/api/companies/${COMPANY.id}/invitations/${PENDING.id}`, async ({ request }) => {
      calls.push(cancelInvitation.input.body.parse(await request.json()))
      return refusal('INVITATION_STALE')
    }),
  )
  open()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Reenviar convite para bia@example.test' }),
  )
  await waitFor(() => expect(calls).toEqual([{ revision: 0 }]))
  fireEvent.click(
    await screen.findByRole('button', { name: 'Cancelar convite para bia@example.test' }),
  )
  const confirmName = `Confirmar cancelamento de convite para ${PENDING.email}`
  fireEvent.click(screen.getByRole('button', { name: confirmName }))
  expect(await screen.findByText('Digite o e-mail do convite.')).toBeTruthy()
  expect(calls).toHaveLength(1)
  fireEvent.change(screen.getByLabelText('Confirmar e-mail'), { target: { value: PENDING.email } })
  fireEvent.click(screen.getByRole('button', { name: confirmName }))
  expect(await screen.findByText('Este convite mudou. Recarregue a página.')).toBeTruthy()
  expect(screen.getByLabelText('Confirmar e-mail')).toHaveProperty('value', PENDING.email)
  expect(calls).toEqual([{ revision: 0 }, { revision: 0 }])
})

test('as ações pequenas ficam na linha, em tabelas com nome (critério 27)', async () => {
  hub({ role: 'owner', mayInviteAs: ['admin', 'member'], invitations: [PENDING] })
  open()
  const people = within(sectionOf(await screen.findByRole('heading', { name: 'Pessoas' })))
  const davi = within(people.getByRole('row', { name: /Davi Costa/ }))
  expect(davi.getByRole('button', { name: 'Mudar papel: Davi Costa' })).toBeTruthy()
  const remove = davi.getByRole('button', { name: 'Tirar da empresa: Davi Costa' })
  expect(remove.className).toContain('text-danger')
  expect(remove.className).toContain('h-7')
  expect(davi.getByRole('button', { name: 'Mudar papel: Davi Costa' }).className).toContain('h-7')
  expect(davi.getByRole('button', { name: 'Mudar papel: Davi Costa' }).className).not.toContain(
    'text-danger',
  )
  expect(people.getByRole('table', { name: 'Pessoas' })).toBeTruthy()
  expect(people.getAllByRole('columnheader').map((head) => head.textContent)).toEqual([
    'Pessoa',
    'Papel',
    'Ações',
  ])
  const pending = within(
    sectionOf(await screen.findByRole('heading', { name: 'Convites pendentes' })),
  )
  const bia = within(pending.getByRole('row', { name: /bia@example.test/ }))
  expect(bia.getByRole('button', { name: 'Reenviar convite para bia@example.test' })).toBeTruthy()
  expect(bia.getByRole('button', { name: 'Cancelar convite para bia@example.test' })).toBeTruthy()
  expect(pending.getByRole('table', { name: 'Convites pendentes' })).toBeTruthy()
})

test('"Cancelar" um convite abre a confirmação numa linha sob o convite, na mesma tabela', async () => {
  hub({ role: 'owner', mayInviteAs: ['admin'], invitations: [PENDING] })
  open()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Cancelar convite para bia@example.test' }),
  )
  const field = screen.getByLabelText('Confirmar e-mail')
  const table = field.closest('table')
  expect(table).not.toBeNull()
  expect(table).toBe(
    screen.getByRole('button', { name: 'Reenviar convite para bia@example.test' }).closest('table'),
  )
})

test('com a confirmação aberta, as ações do convite ficam travadas; "Voltar" fecha a linha e não há recusa', async () => {
  hub({ role: 'owner', mayInviteAs: ['admin'], invitations: [PENDING] })
  open()
  const cancel = await screen.findByRole('button', {
    name: 'Cancelar convite para bia@example.test',
  })
  fireEvent.click(cancel)
  const send = screen.getByRole('button', { name: 'Reenviar convite para bia@example.test' })
  expect(send).toHaveProperty('disabled', true)
  expect(cancel).toHaveProperty('disabled', true)
  expect(screen.queryByRole('alert')).toBeNull()
  fireEvent.click(
    screen.getByRole('button', { name: 'Voltar sem cancelar convite para bia@example.test' }),
  )
  await waitFor(() => expect(screen.queryByLabelText('Confirmar e-mail')).toBeNull())
  expect(send).toHaveProperty('disabled', false)
})

test('enquanto um reenvio espera a resposta do Hub, as duas ações do convite ficam travadas', async () => {
  hub({ role: 'owner', mayInviteAs: ['admin'], invitations: [PENDING] })
  server.use(
    http.put(
      `*/api/companies/${COMPANY.id}/invitations/${PENDING.id}`,
      () => new Promise(() => undefined),
    ),
  )
  open()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Reenviar convite para bia@example.test' }),
  )
  const cancel = await screen.findByRole('button', {
    name: 'Cancelar convite para bia@example.test',
  })
  await waitFor(() => expect(cancel).toHaveProperty('disabled', true))
  expect(
    screen.getByRole('button', { name: 'Reenviar convite para bia@example.test' }).textContent,
  ).toBe('Enviando…')
})
