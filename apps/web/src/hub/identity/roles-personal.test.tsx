import { RoleView } from '@conexus/hub-api'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { FIXED, hub, open, server } from './test-roles.tsx'

const ROLES = `*/api/companies/${COMPANY.id}/roles`
const TITLE = 'Dados pessoais de clientes'

function boxes() {
  const section = within(screen.getByRole('region', { name: TITLE }))
  return {
    contato: section.getByRole('checkbox', { name: 'Contato (nome, e-mail, telefone)' }),
    endereco: section.getByRole('checkbox', { name: 'Endereço' }),
    documento: section.getByRole('checkbox', { name: 'Documento (CPF)' }),
    all: section.getAllByRole('checkbox'),
  }
}

test('Membro mostra os três tipos desmarcados e desmarcáveis, e sensível não aparece', async () => {
  hub({ as: 'owner' })
  open('/settings/roles?role=member')
  await screen.findByRole('region', { name: TITLE })
  const { all, contato } = boxes()
  expect(all).toHaveLength(3)
  expect(all.every((box) => box.getAttribute('aria-checked') === 'false')).toBe(true)
  expect(contato.hasAttribute('disabled')).toBe(false)
  expect(screen.queryByText(/sens[ií]vel/i)).toBeNull()
  expect(
    screen.getByText(
      'Quem tem o papel vê esse tipo de dado nas leituras dos conectores. Documento nunca vai ao Assistente nem ao Builder.',
    ),
  ).toBeTruthy()
})

test('Dono e Administrador mostram os três marcados e travados, sem Salvar', async () => {
  hub({ as: 'owner' })
  for (const role of ['owner', 'admin']) {
    open(`/settings/roles?role=${role}`)
    await screen.findByRole('region', { name: TITLE })
    for (const box of boxes().all) {
      expect(box.getAttribute('aria-checked')).toBe('true')
      expect(box.hasAttribute('disabled') || box.getAttribute('aria-disabled') === 'true').toBe(
        true,
      )
    }
    expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull()
    cleanup()
  }
})

test('salvar marca o tipo: o corpo leva personal e a lista seguinte o mostra marcado', async () => {
  const { roles } = hub({ as: 'owner' })
  const bodies: unknown[] = []
  server.use(
    http.put(`${ROLES}/member`, async ({ request }) => {
      const body = Object(await request.json())
      bodies.push(body)
      const saved = RoleView.parse({ ...FIXED[3], personal: body.personal })
      roles.splice(3, 1, saved)
      return HttpResponse.json({ role: saved })
    }),
  )
  open('/settings/roles?role=member')
  await screen.findByRole('region', { name: TITLE })
  fireEvent.click(boxes().contato)
  fireEvent.click(boxes().endereco)
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(Object(bodies[0]).personal).toEqual(['contato', 'endereco']))
  cleanup()
  open('/settings/roles?role=member')
  await screen.findByRole('region', { name: TITLE })
  expect(boxes().contato.getAttribute('aria-checked')).toBe('true')
  expect(boxes().endereco.getAttribute('aria-checked')).toBe('true')
  expect(boxes().documento.getAttribute('aria-checked')).toBe('false')
})

test('um papel novo mostra a seção e manda os tipos marcados na criação', async () => {
  hub({ as: 'owner' })
  const bodies: unknown[] = []
  server.use(
    http.post(ROLES, async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json({ role: FIXED[3] }, { status: 201 })
    }),
  )
  open('/settings/roles?new=true')
  fireEvent.change(await screen.findByLabelText('Nome do papel'), { target: { value: 'Vendas' } })
  expect(boxes().all.every((box) => box.getAttribute('aria-checked') === 'false')).toBe(true)
  fireEvent.click(boxes().contato)
  fireEvent.click(boxes().endereco)
  fireEvent.click(screen.getByRole('button', { name: 'Criar papel' }))
  await waitFor(() => expect(Object(bodies[0]).personal).toEqual(['contato', 'endereco']))
})
