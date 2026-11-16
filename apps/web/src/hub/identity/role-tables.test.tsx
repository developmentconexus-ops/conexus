import { cleanup, fireEvent, screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { refusal } from '../../platform/test-hub.tsx'
import { CLIENTES, FINANCEIRO, FIXED, hub, open, server, VENDAS } from './test-roles.tsx'

const ROLES = `*/api/companies/${COMPANY.id}/roles`

const COPIED = 'Dados copiados'
const FINANCE = [...FIXED, FINANCEIRO]

function tableBox(name: string) {
  return screen.getByRole('checkbox', { name: new RegExp(name) })
}

test('o papel Financeiro mostra Dados copiados no Sankhya com sankhya_clientes desmarcada (critério 60)', async () => {
  hub({ as: 'owner', roles: FINANCE })
  open('/settings/roles?role=financeiro')
  const sankhya = within(await screen.findByRole('region', { name: 'Sankhya' }))
  expect(sankhya.getByRole('heading', { name: COPIED })).toBeTruthy()
  expect(sankhya.getByText('sankhya_vendas').classList.contains('font-mono')).toBe(true)
  expect(sankhya.getByText('Pedidos e notas de venda, um por linha.')).toBeTruthy()
  expect(tableBox('sankhya_vendas').getAttribute('aria-checked')).toBe('true')
  expect(tableBox('sankhya_clientes').getAttribute('aria-checked')).toBe('false')
  expect(sankhya.queryByText('Nenhuma tabela copiada')).toBeNull()
})

test('marcar e salvar manda updateRole e depois setRoleCopies com a tabela (critério 61)', async () => {
  const { written } = hub({ as: 'owner', roles: FINANCE })
  open('/settings/roles?role=financeiro')
  await screen.findByRole('region', { name: 'Sankhya' })
  fireEvent.click(tableBox('sankhya_clientes'))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('Papéis de fábrica')).toBeTruthy()
  expect(written.map((one) => `${one.method} ${one.path}`)).toEqual([
    'PUT roles/financeiro',
    'PUT roles/financeiro/copies',
  ])
  expect(written[1]?.body).toEqual({ copies: [VENDAS, CLIENTES] })
})

test('o banco calado ao salvar mostra a frase do Hub e mantém a marca (critério 62)', async () => {
  const { written } = hub({ as: 'owner', roles: FINANCE })
  let refused = true
  server.use(
    http.put(`${ROLES}/financeiro/copies`, async ({ request }) => {
      if (refused) return refusal('COPY_DATABASE_UNAVAILABLE')
      written.push({ method: 'PUT', path: 'retry', body: await request.json() })
      return HttpResponse.json({ copies: [VENDAS, CLIENTES] })
    }),
  )
  open('/settings/roles?role=financeiro')
  await screen.findByRole('region', { name: 'Sankhya' })
  fireEvent.click(tableBox('sankhya_clientes'))
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText(/O banco da empresa não respondeu/)).toBeTruthy()
  expect(tableBox('sankhya_clientes').getAttribute('aria-checked')).toBe('true')
  refused = false
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(await screen.findByText('Papéis de fábrica')).toBeTruthy()
  expect(written.map((one) => one.path)).toEqual(['roles/financeiro', 'roles/financeiro', 'retry'])
})

test('uma resposta perdida ao salvar as tabelas mostra que não confirmamos (critério 62)', async () => {
  hub({ as: 'owner', roles: FINANCE })
  server.use(http.put(`${ROLES}/financeiro/copies`, () => HttpResponse.error()))
  open('/settings/roles?role=financeiro')
  await screen.findByRole('region', { name: 'Sankhya' })
  fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  expect(
    await screen.findByText('Não confirmamos a gravação. Veja a lista de papéis.'),
  ).toBeTruthy()
})

test('Dono mostra todas as tabelas marcadas e nenhuma caixa que mude (critério 63)', async () => {
  const { written } = hub({ as: 'owner' })
  open('/settings/roles?role=owner')
  await screen.findByRole('region', { name: 'Sankhya' })
  const boxes = ['sankhya_vendas', 'sankhya_clientes'].map((name) => tableBox(name))
  for (const box of boxes) {
    expect(box.getAttribute('aria-checked')).toBe('true')
    expect(box.hasAttribute('disabled') || box.getAttribute('aria-disabled') === 'true').toBe(true)
    fireEvent.click(box)
    expect(box.getAttribute('aria-checked')).toBe('true')
  }
  expect(screen.getByText(/Dono e Administrador usam tudo/)).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Salvar' })).toBeNull()
  expect(written).toEqual([])
})

test('um sistema sem cópia diz Nenhuma tabela copiada (critério 64)', async () => {
  hub({ as: 'owner', roles: FINANCE, copies: [] })
  open('/settings/roles?role=financeiro')
  const sankhya = within(await screen.findByRole('region', { name: 'Sankhya' }))
  expect(sankhya.getByRole('heading', { name: COPIED })).toBeTruthy()
  expect(sankhya.getByText('Nenhuma tabela copiada')).toBeTruthy()
})

test('o bloco diz que desmarcar não tira a leitura ao vivo (critério 65)', async () => {
  hub({ as: 'owner', roles: FINANCE })
  const live =
    'Desmarcar uma tabela não tira a leitura ao vivo do sistema. Ela segue as operações marcadas acima.'
  for (const role of ['financeiro', 'owner']) {
    open(`/settings/roles?role=${role}`)
    await screen.findByRole('region', { name: 'Sankhya' })
    expect(screen.getAllByText(live)).toHaveLength(1)
    cleanup()
  }
})

test('as tabelas não carregam: Não deu para carregar os papéis. e Tentar de novo lê outra vez (critério 67)', async () => {
  for (const path of ['copies', 'copy-readers']) {
    cleanup()
    let fail = true
    const { written } = hub({ as: 'owner', roles: FINANCE })
    expect(written).toEqual([])
    const url = `*/api/companies/${COMPANY.id}/${path}`
    server.use(http.get(url, () => (fail ? new HttpResponse(null, { status: 500 }) : undefined)))
    open('/settings/roles?role=financeiro')
    expect(await screen.findByText('Não deu para carregar os papéis.')).toBeTruthy()
    fail = false
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('region', { name: 'Sankhya' })).toBeTruthy()
  }
})
