import type { CompanyNetworkOpen } from '@conexus/hub-api'
import {
  addNetworkDomain,
  CompanyNetworkDomain,
  DEVELOPMENT_HOSTS,
  listNetworkDomains,
  NetworkDomain,
  openAllNetwork,
  readOpenAllNetwork,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import { companyRead, hubServer, refusal, sessionRead } from '../../platform/test-hub.tsx'

const server = hubServer()
const PAGE = `/companies/${COMPANY.id}/settings/network`
const DOMAINS = `*/api/companies/${COMPANY.id}/network/domains`
const OPEN_ALL = `*/api/companies/${COMPANY.id}/network/open-all`
const NOTE = 'Com a internet toda ligada, esta lista não limita as máquinas.'
const ONLY_MANAGERS = 'Só o dono ou um administrador adiciona ou tira domínios.'
const ONLY_OWNER = 'Só o dono liga a internet toda.'
const WARNING =
  'Com a internet toda, as máquinas dos agentes alcançam qualquer site. Um agente que leu dado da empresa pode ser enganado pelo texto de uma página e mandar esse dado para fora. A lista de domínios deixa de ser a trava.'
const OPENED: CompanyNetworkOpen = { openedBy: 'Ana Lima', openedAt: '2026-11-20T15:00:00.000Z' }

function row(domain: string, grantedBy: string | null = 'Ana Lima') {
  return CompanyNetworkDomain.parse({
    id: crypto.randomUUID(),
    domain,
    reason: 'ler os preços',
    grantedBy,
    grantedAt: '2026-11-12T15:00:00.000Z',
  })
}

type Role = 'owner' | 'admin' | 'developer' | 'member'
type Hub = { domains: CompanyNetworkDomain[]; open: CompanyNetworkOpen | null }

function open(role: Role, start: Partial<Hub> = {}) {
  const hub: Hub = { domains: [], open: null, ...start }
  server.use(
    sessionRead(() => ANA),
    ...companyRead({ role }),
    http.get(DOMAINS, () =>
      HttpResponse.json(listNetworkDomains.success.body.parse({ domains: hub.domains })),
    ),
    http.post(DOMAINS, async ({ request }) => {
      const body = addNetworkDomain.input.body.parse(await request.json())
      const domain = NetworkDomain.safeParse(body.domain)
      if (!domain.success) return refusal('NETWORK_DOMAIN_INVALID')
      const added = { ...row(domain.data), reason: body.reason }
      hub.domains = [...hub.domains, added]
      return HttpResponse.json(added)
    }),
    http.delete(`${DOMAINS}/:domainId`, ({ params }) => {
      const kept = hub.domains.filter((one) => one.id !== params.domainId)
      if (kept.length === hub.domains.length) return refusal('NOT_FOUND')
      hub.domains = kept
      return new HttpResponse(null, { status: 204 })
    }),
    http.get(OPEN_ALL, () =>
      HttpResponse.json(readOpenAllNetwork.success.body.parse({ open: hub.open })),
    ),
    http.put(OPEN_ALL, () => {
      hub.open ??= OPENED
      return HttpResponse.json(openAllNetwork.success.body.parse(hub.open))
    }),
    http.delete(OPEN_ALL, () => {
      hub.open = null
      return new HttpResponse(null, { status: 204 })
    }),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [PAGE] }))} />)
  return hub
}

function section(name: string) {
  return screen.findByRole('region', { name })
}

function gone() {
  return waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
}

test.each<[Role, boolean]>([
  ['owner', true],
  ['admin', true],
  ['developer', false],
  ['member', false],
])(
  '%s: Internet no índice e a lista da empresa, com Adicionar e Remover só para quem gerencia',
  async (role, manages) => {
    open(role, { domains: [row('loja.exemplo.com.br'), row('*.cdn.exemplo.com', null)] })
    const list = within(await section('Lista da empresa'))
    const nav = within(screen.getByRole('navigation', { name: 'Navegação' }))
    expect(nav.getByRole('link', { name: 'Internet' }).getAttribute('href')).toBe(PAGE)
    expect(screen.getByRole('heading', { name: 'Internet', level: 1 })).toBeTruthy()
    const [first, starred] = list.getAllByRole('listitem')
    expect(first?.textContent).toContain('loja.exemplo.com.br')
    expect(first?.textContent).toContain('ler os preços')
    expect(first?.textContent).toContain('Liberado por Ana Lima em 12/11/2026')
    expect(starred?.textContent).toContain(
      'qualquer endereço que termina em .cdn.exemplo.com, menos o próprio cdn.exemplo.com',
    )
    expect(starred?.textContent).toContain('Liberado em 12/11/2026')
    expect(list.queryByRole('button', { name: 'Adicionar' }) !== null).toBe(manages)
    expect(list.queryByRole('button', { name: 'Remover loja.exemplo.com.br' }) !== null).toBe(
      manages,
    )
    expect(list.queryByText(ONLY_MANAGERS) === null).toBe(manages)
  },
)

test('adicionar e remover: os erros dos campos aparecem juntos, e a lista muda sem recarregar', async () => {
  const hub = open('admin')
  const list = within(await section('Lista da empresa'))
  expect(list.getByText('Nenhum domínio liberado.')).toBeTruthy()
  fireEvent.click(list.getByRole('button', { name: 'Adicionar' }))
  const dialog = within(await screen.findByRole('dialog', { name: 'Adicionar domínio' }))
  const domain = dialog.getByRole('textbox', { name: 'Domínio' })
  const reason = dialog.getByRole('textbox', { name: 'Motivo' })
  fireEvent.change(domain, { target: { value: 'https://loja.exemplo.com.br/ofertas' } })
  fireEvent.click(dialog.getByRole('button', { name: 'Adicionar' }))
  expect(await dialog.findByText('Escreva o motivo.')).toBeTruthy()
  expect(dialog.getByText('Este domínio não pode ser liberado.')).toBeTruthy()
  expect(domain.getAttribute('aria-invalid')).toBe('true')
  expect(reason.getAttribute('aria-invalid')).toBe('true')
  expect(hub.domains).toEqual([])
  fireEvent.change(reason, { target: { value: 'ler os preços' } })
  fireEvent.change(domain, { target: { value: 'Loja.Exemplo.com.br' } })
  fireEvent.click(dialog.getByRole('button', { name: 'Adicionar' }))
  const remove = await list.findByRole('button', { name: 'Remover loja.exemplo.com.br' })
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

  fireEvent.click(remove)
  const ask = within(
    await screen.findByRole('alertdialog', { name: 'Tirar loja.exemplo.com.br da lista?' }),
  )
  expect(
    ask.getByText(
      'As máquinas ligadas deixam de alcançar este domínio em segundos. Uma conversa que liberou o mesmo domínio continua alcançando.',
    ),
  ).toBeTruthy()
  expect(hub.domains).toHaveLength(1)
  fireEvent.click(ask.getByRole('button', { name: 'Remover' }))
  expect(await list.findByText('Nenhum domínio liberado.')).toBeTruthy()
  await gone()
  expect(hub.domains).toEqual([])
})

test('o domínio que a tela aceitou e o Hub recusa recebe a frase no campo', async () => {
  open('admin')
  const list = within(await section('Lista da empresa'))
  server.use(http.post(DOMAINS, () => refusal('NETWORK_DOMAIN_INVALID')))
  fireEvent.click(list.getByRole('button', { name: 'Adicionar' }))
  const dialog = within(await screen.findByRole('dialog', { name: 'Adicionar domínio' }))
  const domain = dialog.getByRole('textbox', { name: 'Domínio' })
  fireEvent.change(domain, { target: { value: 'loja.exemplo.com.br' } })
  fireEvent.change(dialog.getByRole('textbox', { name: 'Motivo' }), {
    target: { value: 'ler os preços' },
  })
  fireEvent.click(dialog.getByRole('button', { name: 'Adicionar' }))
  expect(await dialog.findByText('Este domínio não pode ser liberado.')).toBeTruthy()
  expect(domain.getAttribute('aria-invalid')).toBe('true')
})

test('remover um domínio já tirado relê a lista, sem erro', async () => {
  const hub = open('owner', { domains: [row('loja.exemplo.com.br')] })
  const list = within(await section('Lista da empresa'))
  fireEvent.click(list.getByRole('button', { name: 'Remover loja.exemplo.com.br' }))
  const ask = within(await screen.findByRole('alertdialog'))
  hub.domains = []
  fireEvent.click(ask.getByRole('button', { name: 'Remover' }))
  expect(await list.findByText('Nenhum domínio liberado.')).toBeTruthy()
  await gone()
  expect(screen.queryByRole('alert')).toBeNull()
})

test('uma mudança sem resposta do Hub diz que não foi confirmada, na lista e no estado', async () => {
  open('owner', { domains: [row('loja.exemplo.com.br')] })
  const list = within(await section('Lista da empresa'))
  server.use(
    http.delete(`${DOMAINS}/:domainId`, () => HttpResponse.error()),
    http.put(OPEN_ALL, () => HttpResponse.error()),
  )
  fireEvent.click(list.getByRole('button', { name: 'Remover loja.exemplo.com.br' }))
  const removing = within(await screen.findByRole('alertdialog'))
  fireEvent.click(removing.getByRole('button', { name: 'Remover' }))
  expect((await removing.findByRole('alert')).textContent).toBe(
    'Não confirmamos a mudança. Veja a lista.',
  )
  fireEvent.click(removing.getByRole('button', { name: 'Cancelar' }))
  await gone()

  fireEvent.click(screen.getByRole('switch', { name: 'Internet toda' }))
  const opening = within(await screen.findByRole('alertdialog'))
  fireEvent.click(opening.getByRole('button', { name: 'Ligar internet toda' }))
  expect((await opening.findByRole('alert')).textContent).toBe(
    'Não confirmamos a mudança. Veja o estado.',
  )
})

test('a internet toda, dono: ligar pede a confirmação com o aviso, mostra quem ligou, e desligar volta', async () => {
  const hub = open('owner')
  const whole = within(await section('Internet toda'))
  const toggle = whole.getByRole('switch', { name: 'Internet toda' })
  expect(toggle.getAttribute('aria-checked')).toBe('false')
  expect(whole.getByText('Desligada')).toBeTruthy()
  expect(whole.queryByText(ONLY_OWNER)).toBeNull()

  fireEvent.click(toggle)
  const first = within(await screen.findByRole('alertdialog', { name: 'Ligar a internet toda?' }))
  expect(first.getByText(WARNING)).toBeTruthy()
  fireEvent.click(first.getByRole('button', { name: 'Cancelar' }))
  await gone()
  expect(hub.open).toBeNull()

  fireEvent.click(toggle)
  const ask = within(await screen.findByRole('alertdialog'))
  fireEvent.click(ask.getByRole('button', { name: 'Ligar internet toda' }))
  expect(await whole.findByText('Ligada por Ana Lima em 20/11/2026')).toBeTruthy()
  await gone()
  expect(toggle.getAttribute('aria-checked')).toBe('true')
  const list = within(await section('Lista da empresa'))
  expect(list.getByText(NOTE)).toBeTruthy()
  expect(list.getByRole('button', { name: 'Adicionar' })).toBeTruthy()

  fireEvent.click(toggle)
  expect(await whole.findByText('Desligada')).toBeTruthy()
  expect(screen.queryByText(NOTE)).toBeNull()
  expect(hub.open).toBeNull()
})

test.each<[Role, CompanyNetworkOpen | null, string]>([
  ['admin', null, 'Desligada'],
  ['admin', OPENED, 'Ligada por Ana Lima em 20/11/2026'],
  ['developer', null, 'Desligada'],
  ['developer', OPENED, 'Ligada por Ana Lima em 20/11/2026'],
  ['member', null, 'Desligada'],
  ['member', OPENED, 'Ligada por Ana Lima em 20/11/2026'],
])('a internet toda, %s: o estado sem o interruptor', async (role, opened, state) => {
  open(role, { open: opened })
  const whole = within(await section('Internet toda'))
  expect(whole.getByText(state)).toBeTruthy()
  expect(whole.getByText(ONLY_OWNER)).toBeTruthy()
  expect(whole.queryByRole('switch')).toBeNull()
  expect(screen.queryByText(NOTE) !== null).toBe(opened !== null)
})

test('a internet toda ligada por quem a empresa não lê mais mostra só o dia, e a lista avisa', async () => {
  open('member', {
    domains: [row('loja.exemplo.com.br')],
    open: { openedBy: null, openedAt: OPENED.openedAt },
  })
  const whole = within(await section('Internet toda'))
  expect(whole.getByText('Ligada em 20/11/2026')).toBeTruthy()
  expect(whole.queryByRole('switch')).toBeNull()
  const list = within(await section('Lista da empresa'))
  expect(list.getByText(NOTE)).toBeTruthy()
  expect(list.getByRole('listitem').textContent).toContain('loja.exemplo.com.br')
})

test('desligar a internet toda já desligada relê o estado, sem erro', async () => {
  const hub = open('owner', { open: OPENED })
  const whole = within(await section('Internet toda'))
  hub.open = null
  fireEvent.click(whole.getByRole('switch'))
  expect(await whole.findByText('Desligada')).toBeTruthy()
  expect(screen.queryByRole('alert')).toBeNull()
})

test.each<Role>(['owner', 'admin', 'developer', 'member'])(
  'a lista pronta, %s: os endereços que vêm com o Conexus, sem Remover',
  async (role) => {
    open(role)
    const ready = within(await section('Vem com o Conexus'))
    expect(ready.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      ...DEVELOPMENT_HOSTS,
    ])
    expect(ready.queryByRole('button')).toBeNull()
  },
)

test('enquanto lê, a página mostra o título e o esqueleto', async () => {
  open('owner')
  const held = Promise.withResolvers<void>()
  server.use(
    http.get(DOMAINS, async () => {
      await held.promise
      return HttpResponse.json({ domains: [] })
    }),
  )
  expect(await screen.findByRole('status', { name: 'Carregando' })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Internet', level: 1 })).toBeTruthy()
  held.resolve()
  expect(await section('Lista da empresa')).toBeTruthy()
})

test('a lista que não pôde ser lida mostra a frase e relê com Tentar de novo', async () => {
  open('owner')
  server.use(http.get(DOMAINS, () => refusal('DATABASE_UNAVAILABLE'), { once: true }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    sentenceOfCode('DATABASE_UNAVAILABLE'),
  )
  expect(screen.getByRole('heading', { name: 'Internet', level: 1 })).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await section('Lista da empresa')).toBeTruthy()
})

test('a empresa que a pessoa não lê mostra o não encontrado', async () => {
  open('member')
  server.use(http.get(DOMAINS, () => refusal('NOT_FOUND')))
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
})
