import { CopyId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import {
  CLIENTES,
  connection,
  copy,
  copyRun,
  detailOf,
  LIST,
  onPhone,
  openCopies,
  VENDAS,
} from './test-hub.tsx'
import { CATALOG, STORES } from './test-sources.ts'

// The tree of Dados in the frame, in place of the conversations (Requisito 1).
const server = hubServer()

const OTHER = CopyId.parse('99999999-9999-4999-8999-999999999999')

async function tree() {
  return within(await screen.findByRole('navigation', { name: 'Dados' }))
}

function three() {
  return [
    copy(),
    copy({ id: CLIENTES, name: 'clientes', label: 'Clientes' }),
    copy({ id: OTHER, name: 'ml_pedidos', label: 'Pedidos', sources: STORES }),
  ]
}

test('a árvore: no lugar Dados ela toma o lugar das conversas', async () => {
  openCopies(server, { copies: [copy()] }, LIST)
  const nav = await tree()
  expect(nav.queryByRole('link', { name: 'Nova conversa' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Nova conversa' })).toBeNull()
})

test('a árvore: fora de Dados, as conversas ficam', async () => {
  openCopies(server, { copies: [copy()] }, `/companies/${COMPANY.id}`)
  expect(await screen.findByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Dados' })).toBeNull()
})

test('a árvore: o membro no endereço de Dados fica com as conversas', async () => {
  openCopies(server, { copies: [copy()] }, LIST, 'member')
  expect(await screen.findByText('Não encontramos o que você procurou.')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Dados' })).toBeNull()
})

test('a árvore: Negócio 0, Bruto com o número de tabelas, Apps', async () => {
  openCopies(server, { copies: three() }, LIST)
  const nav = await tree()
  expect(await nav.findByRole('link', { name: 'Negócio 0' })).toBeTruthy()
  expect(nav.getByRole('link', { name: 'Bruto 3' })).toBeTruthy()
  expect(nav.getByRole('link', { name: 'Apps' })).toBeTruthy()
  expect(nav.getByRole('button', { name: 'Sankhya 2' })).toBeTruthy()
  expect(nav.getByRole('button', { name: 'Mercado Livre 1' })).toBeTruthy()
})

async function currentGroups(path: string) {
  openCopies(server, { copies: three() }, path)
  const nav = await tree()
  async function current(name: string) {
    return (await nav.findByRole('link', { name })).getAttribute('aria-current')
  }
  return [await current('Negócio 0'), await current('Bruto 3'), await current('Apps')]
}

test('a árvore: Bruto é o lugar atual na camada Bruta e só nela', async () => {
  expect(await currentGroups(LIST)).toEqual([null, 'page', null])
})

test('a árvore: Negócio é o lugar atual em ?layer=business', async () => {
  expect(await currentGroups(`${LIST}?layer=business`)).toEqual(['page', null, null])
})

test('a árvore: Apps é o lugar atual em ?layer=apps', async () => {
  expect(await currentGroups(`${LIST}?layer=apps`)).toEqual([null, null, 'page'])
})

test('a árvore: numa página de tabela nenhum grupo de camada é o lugar atual', async () => {
  openCopies(server, { copies: three() }, detailOf(VENDAS))
  const nav = await tree()
  const link = await nav.findByRole('link', { name: 'Bruto 3' })
  expect(link.getAttribute('aria-current')).toBeNull()
  expect(nav.getByRole('link', { name: 'Negócio 0' }).getAttribute('aria-current')).toBeNull()
  expect(nav.getByRole('link', { name: 'Apps' }).getAttribute('aria-current')).toBeNull()
  expect((await nav.findByRole('link', { name: /^vendas/ })).getAttribute('aria-current')).toBe(
    'page',
  )
})

test('a árvore: a tabela pausada diz Pausada, mesmo com a rodada aberta', async () => {
  openCopies(
    server,
    {
      copies: [
        copy({
          schedule: { kind: 'PAUSED' },
          run: copyRun({ outcome: { kind: 'RUNNING' }, endedAt: null }),
        }),
      ],
    },
    LIST,
  )
  const nav = await tree()
  const row = await nav.findByRole('link', { name: /^vendas/ })
  expect(within(row).getByText('Pausada')).toBeTruthy()
  expect(within(row).queryByText('Rodando…')).toBeNull()
  expect(within(row).queryByText('118.402')).toBeNull()
})

test('a árvore: a tabela aberta é a atual e o sistema dela está aberto', async () => {
  openCopies(server, { copies: three() }, detailOf(OTHER))
  const nav = await tree()
  const link = await nav.findByRole('link', { name: /^ml_pedidos/ })
  expect(link.getAttribute('aria-current')).toBe('page')
  expect(nav.queryByRole('link', { name: /^vendas/ })).toBeNull()
})

test('a árvore: sem tabela atual, o primeiro sistema abre e o outro fica fechado', async () => {
  openCopies(server, { copies: three() }, LIST)
  const nav = await tree()
  expect(await nav.findByRole('link', { name: /^vendas/ })).toBeTruthy()
  expect(nav.queryByRole('link', { name: /^ml_pedidos/ })).toBeNull()
})

test('a árvore: carregando, três esqueletos', async () => {
  let arrive: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    arrive = resolve
  })
  openCopies(server, { copies: [copy()] }, LIST)
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/copies`, async () => {
      await held
      return HttpResponse.json({ copies: [copy()], proposals: [] })
    }),
  )
  const nav = await tree()
  const status = nav.getByRole('status')
  expect(status.textContent).toBe('Carregando')
  expect(document.querySelectorAll('nav [data-slot="skeleton"]')).toHaveLength(3)
  arrive()
  expect(await nav.findByRole('button', { name: 'Sankhya 1' })).toBeTruthy()
})

test('a árvore: a falha das cópias e Tentar de novo', async () => {
  let fail = true
  openCopies(
    server,
    {
      copies: [copy()],
      answers: { list: () => (fail ? refusal('DATABASE_UNAVAILABLE') : undefined) },
    },
    LIST,
  )
  const nav = await tree()
  const alert = await nav.findByRole('alert')
  expect(alert.textContent).toBe(
    'Não deu para ler o catálogo agora. Nada foi apagado. Tente de novo em instantes.',
  )
  fail = false
  fireEvent.click(nav.getByRole('button', { name: 'Tentar de novo' }))
  expect(await nav.findByRole('button', { name: 'Sankhya 1' })).toBeTruthy()
})

test('a árvore: a falha das conexões chama a leitura delas de novo', async () => {
  let fail = true
  openCopies(server, { copies: [copy()] }, LIST)
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/connections`, () =>
      fail
        ? refusal('DATABASE_UNAVAILABLE')
        : HttpResponse.json({ connectors: CATALOG, connections: [connection()], mayManage: true }),
    ),
  )
  const nav = await tree()
  const retry = await nav.findByRole('button', { name: 'Tentar de novo' })
  expect(nav.getByRole('alert')).toBeTruthy()
  fail = false
  fireEvent.click(retry)
  expect(await nav.findByRole('button', { name: 'Sankhya 1' })).toBeTruthy()
})

test('a árvore: sem sistema, Bruto 0 e a frase', async () => {
  openCopies(server, { copies: [], connections: [] }, LIST)
  const nav = await tree()
  expect(await nav.findByRole('link', { name: 'Bruto 0' })).toBeTruthy()
  expect(await nav.findByText('Nenhum sistema ligado ainda')).toBeTruthy()
})

test('a árvore: um sistema ligado sem cópia não aparece', async () => {
  openCopies(server, { copies: [], connections: [connection()] }, LIST)
  const nav = await tree()
  expect(await nav.findByRole('link', { name: 'Bruto 0' })).toBeTruthy()
  expect(await nav.findByText('Nenhuma tabela copiada')).toBeTruthy()
  expect(nav.queryByRole('button', { name: /^Sankhya/ })).toBeNull()
})

test('a árvore no celular: tocar numa tabela fecha a gaveta', async () => {
  await onPhone(async () => {
    openCopies(server, { copies: [copy()] }, LIST)
    fireEvent.click(await screen.findByRole('button', { name: 'Abrir navegação' }))
    const drawer = within(await screen.findByRole('dialog'))
    fireEvent.click(await drawer.findByRole('link', { name: /^vendas/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(await screen.findByRole('heading', { name: 'vendas' })).toBeTruthy()
  })
})

test('a árvore já montada: abrir uma tabela pela lista da página abre o sistema dela', async () => {
  openCopies(server, { copies: three() }, LIST)
  const nav = await tree()
  expect(await nav.findByRole('button', { name: 'Mercado Livre 1' })).toHaveProperty(
    'ariaExpanded',
    'false',
  )
  const main = within(await screen.findByRole('main'))
  fireEvent.click(await main.findByRole('link', { name: 'ml_pedidos' }))
  expect(await screen.findByRole('heading', { name: 'ml_pedidos' })).toBeTruthy()
  const row = await nav.findByRole('link', { name: /^ml_pedidos/ })
  expect(row.getAttribute('aria-current')).toBe('page')
})

test('a árvore já montada: digitar na busca abre o sistema que sobra', async () => {
  openCopies(server, { copies: three() }, LIST)
  const nav = await tree()
  expect(await nav.findByRole('button', { name: 'Mercado Livre 1' })).toHaveProperty(
    'ariaExpanded',
    'false',
  )
  fireEvent.change(nav.getByRole('searchbox', { name: 'Buscar tabela ou coluna' }), {
    target: { value: 'ml_' },
  })
  expect(await nav.findByRole('link', { name: /^ml_pedidos/ })).toBeTruthy()
  expect(nav.getByRole('button', { name: 'Mercado Livre 1' })).toHaveProperty(
    'ariaExpanded',
    'true',
  )
})
