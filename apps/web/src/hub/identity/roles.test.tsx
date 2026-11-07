import { createRole } from '@conexus/hub-api'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { refusal } from '../../platform/test-hub.tsx'
import { ATENDENTE, customRole, FIXED, hub, open, server } from './test-roles.tsx'

const ROLES = `*/api/companies/${COMPANY.id}/roles`

test('a lista: os quatro papéis de hoje dizem o que usam, e a empresa ainda não criou papéis', async () => {
  hub({ as: 'owner' })
  open()
  expect(await screen.findByRole('heading', { name: 'Papéis da empresa' })).toBeTruthy()
  const rows = screen.getAllByRole('link').filter((link) => link.textContent?.includes('pessoa'))
  expect(rows.map((row) => row.textContent)).toEqual([
    'DonoUsa tudo de todos os conectores1 pessoa',
    'AdministradorUsa tudo de todos os conectores0 pessoas',
    'DesenvolvedorLê tudo de todos os conectores0 pessoas',
    'MembroLê tudo de todos os conectores1 pessoa',
  ])
  expect(screen.getByText('Sua empresa ainda não criou papéis.')).toBeTruthy()
})

test('criar um papel: o dono cria "Atendente", marca Vendas, deixa só Pedidos, salva, e a linha diz "Sankhya: 1 operação de Vendas" (critério 13)', async () => {
  const { roles } = hub({ as: 'owner' })
  const bodies: unknown[] = []
  server.use(
    http.post(ROLES, async ({ request }) => {
      const body = createRole.input.body.parse(await request.json())
      bodies.push(body)
      const made = customRole(body.label, 'atendente', Object.values(body.connectors).flat())
      roles.push(made)
      return HttpResponse.json({ role: made }, { status: 201 })
    }),
  )
  open()
  fireEvent.click(await screen.findByRole('link', { name: /Novo papel/ }))
  fireEvent.change(await screen.findByLabelText('Nome do papel'), { target: { value: 'Atendente' } })
  const sankhya = within(screen.getByRole('region', { name: 'Sankhya' }))
  expect(sankhya.getAllByRole('checkbox').every((box) => box.getAttribute('aria-checked') === 'false')).toBe(true)
  fireEvent.click(sankhya.getByRole('checkbox', { name: /Vendas/ }))
  fireEvent.click(sankhya.getByRole('button', { name: 'Detalhe de Vendas' }))
  fireEvent.click(sankhya.getByRole('checkbox', { name: /Lançar pedido/ }))
  fireEvent.click(sankhya.getByRole('checkbox', { name: /Cancelar pedido/ }))
  expect(sankhya.getByText('lê')).toBeTruthy()
  expect(sankhya.getByRole('checkbox', { name: /Pedidos/ }).getAttribute('aria-checked')).toBe('true')
  fireEvent.click(screen.getByRole('button', { name: 'Criar papel' }))
  expect(await screen.findByText('Sankhya: 1 operação de Vendas')).toBeTruthy()
  expect(bodies).toEqual([{ label: 'Atendente', connectors: { sankhya: ['pedidos'] } }])
  expect(screen.queryByText('Sua empresa ainda não criou papéis.')).toBeNull()
})

test('o nome tomado fica no campo, com o que foi marcado', async () => {
  hub({ as: 'owner' })
  server.use(http.post(ROLES, () => refusal('ROLE_NAME_TAKEN')))
  open('/settings/roles?novo=true')
  fireEvent.change(await screen.findByLabelText('Nome do papel'), { target: { value: 'Membro' } })
  const sankhya = within(screen.getByRole('region', { name: 'Sankhya' }))
  fireEvent.click(sankhya.getByRole('checkbox', { name: /Financeiro/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Criar papel' }))
  expect(await screen.findByText(/Já existe um papel com esse nome/)).toBeTruthy()
  expect(sankhya.getByRole('checkbox', { name: /Financeiro/ }).getAttribute('aria-checked')).toBe('true')
})

test('mudar o Membro: desmarca Financeiro e a Porta de leitura e salva só os conectores', async () => {
  hub({ as: 'owner' })
  const bodies: unknown[] = []
  server.use(
    http.put(`${ROLES}/member`, async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json({ role: FIXED[3] })
    }),
  )
  open('/settings/roles?role=member')
  const sankhya = within(await screen.findByRole('region', { name: 'Sankhya' }))
  fireEvent.click(sankhya.getByRole('checkbox', { name: /Financeiro/ }))
  fireEvent.click(sankhya.getByRole('checkbox', { name: /Porta de leitura/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(bodies).toEqual([{ connectors: { sankhya: ['pedidos'] } }]))
})

test('Dono e Administrador abrem só para ler', async () => {
  hub({ as: 'owner' })
  open('/settings/roles?role=owner')
  expect(await screen.findByText(/Este papel não muda/)).toBeTruthy()
  const sankhya = within(screen.getByRole('region', { name: 'Sankhya' }))
  expect(sankhya.getAllByRole('checkbox').every((box) => box.hasAttribute('disabled') || box.getAttribute('aria-disabled') === 'true')).toBe(true)
  expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull()
})

test('um papel apagado: "Este papel não existe mais."', async () => {
  hub({ as: 'owner' })
  open('/settings/roles?role=fantasma')
  expect(await screen.findByText('Este papel não existe mais.')).toBeTruthy()
})

test('apagar um papel em uso mostra quem o usa e não apaga (critério 14)', async () => {
  const deletes: string[] = []
  hub({
    as: 'owner',
    roles: [...FIXED, ATENDENTE],
    people: [
      { personId: 'person-bruno', name: 'Bruno Souza', email: 'bruno@example.test', role: 'atendente' },
    ],
  })
  server.use(
    http.delete(`${ROLES}/atendente`, ({ request }) => {
      deletes.push(new URL(request.url).pathname)
      return refusal('ROLE_IN_USE')
    }),
  )
  open('/settings/roles?role=atendente')
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar papel: Atendente' }))
  const dialog = within(await screen.findByRole('alertdialog'))
  fireEvent.click(dialog.getByRole('button', { name: 'Apagar papel' }))
  expect(await dialog.findByText(/Uma pessoa ou um convite aberto ainda usa este papel/)).toBeTruthy()
  const who = await dialog.findByRole('list', { name: 'Quem usa este papel' })
  expect(who.textContent).toContain('Bruno Souza')
  expect(deletes).toHaveLength(1)
  expect(screen.getByRole('heading', { name: 'Atendente', hidden: true })).toBeTruthy()
})

test('apagar um papel sem ninguém: apaga e volta à lista sem ele', async () => {
  const { roles } = hub({ as: 'owner', roles: [...FIXED, customRole('Estagiário', 'estagiario', ['pedidos'])] })
  server.use(
    http.delete(`${ROLES}/estagiario`, () => {
      roles.pop()
      return new HttpResponse(null, { status: 204 })
    }),
  )
  open('/settings/roles?role=estagiario')
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar papel: Estagiário' }))
  const dialog = within(await screen.findByRole('alertdialog'))
  fireEvent.click(dialog.getByRole('button', { name: 'Apagar papel' }))
  expect(await screen.findByText('Sua empresa ainda não criou papéis.')).toBeTruthy()
})

test('Membro e Desenvolvedor não veem o item Papéis, e o endereço dá não encontrado (critério 13)', async () => {
  for (const as of ['member', 'developer'] as const) {
    hub({ as })
    const { unmount } = open('/settings/people')
    expect(await screen.findAllByRole('link', { name: /Pessoas e convites/ })).toBeTruthy()
    expect(screen.queryByRole('link', { name: /Papéis/ })).toBeNull()
    unmount()
    open('/settings/roles')
    expect(await screen.findByText('Não encontramos o que você procurou.')).toBeTruthy()
    cleanup()
  }
})

test('o dono vê o item Papéis em Configurações', async () => {
  hub({ as: 'owner' })
  open('/settings/people')
  expect(await screen.findByRole('link', { name: /Papéis/ })).toBeTruthy()
})
