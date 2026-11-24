import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import { BRUNO, MATRIZ, openReads, RESUMO, read, readsHub, server, THREAD } from './test-hub.tsx'

// Configurações, Registro de dados (`p4-04` a `p4-06`): only an owner or an administrator (D1 (a)).

function rowTexts() {
  return within(screen.getByRole('table', { name: 'Registro de dados' }))
    .getAllByRole('row')
    .slice(1)
    .map((row) => Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent))
}

async function choose(field: string, option: string) {
  fireEvent.click(await screen.findByRole('combobox', { name: field }))
  const item = await screen.findByRole('option', { name: option })
  fireEvent.pointerDown(item)
  fireEvent.mouseDown(item)
  fireEvent.pointerUp(item)
  fireEvent.mouseUp(item)
  fireEvent.click(item)
}

test('o item só para quem administra', async () => {
  for (const role of ['owner', 'admin']) {
    readsHub({ as: role })
    const { unmount } = openReads()
    const nav = within(await screen.findByRole('navigation', { name: 'Navegação' }))
    const links = nav.getAllByRole('link').map((link) => link.textContent)
    expect(links.indexOf('Registro de dados'), role).toBe(links.indexOf('Papéis') + 1)
    expect(await screen.findByRole('heading', { name: 'Registro de dados' })).toBeTruthy()
    unmount()
  }
  for (const role of ['member', 'developer']) {
    readsHub({ as: role })
    const { unmount } = openReads()
    expect(await screen.findByText('Não encontramos o que você procurou.'), role).toBeTruthy()
    const nav = within(screen.getByRole('navigation', { name: 'Navegação' }))
    expect(nav.queryByRole('link', { name: 'Registro de dados' }), role).toBeNull()
    unmount()
  }
})

test('a lista e o filtro no endereço', async () => {
  const asked: string[] = []
  const gone = '99999999-9999-4999-8999-999999999999'
  const reads = [
    read({ project: { id: PEDIDOS.id, name: 'Pedidos' } }),
    read({ outcome: 'NOT_IN_CATALOG', tables: ['sankhya_clientes'], rows: null }),
    read({
      agent: 'BUILDER',
      verb: 'QUERY',
      tables: [],
      query: 'select 1',
      outcome: 'NOT_IN_ROLE',
      rows: null,
    }),
    read({ agent: 'AGENT', agentId: RESUMO, outcome: 'QUERY_REFUSED', rows: null }),
    read({ agent: 'AGENT', agentId: gone, project: { id: PEDIDOS.id, name: null } }),
    read({
      ...{ agent: 'CONSTRUTOR', verb: 'LIVE', tables: [], connection: MATRIZ },
      ...{ operation: 'lerPedidos', outcome: 'UNREACHABLE', rows: null },
    }),
    // An app's query the database refused, and one that never reached it (founder, "3. A").
    read({
      agent: 'APP',
      verb: 'QUERY',
      tables: [],
      query: 'select 2',
      outcome: '42501',
      rows: null,
    }),
    read({
      agent: 'APP',
      verb: 'QUERY',
      tables: [],
      query: 'select 3',
      outcome: '08000',
      rows: null,
    }),
  ]
  readsHub({ as: 'owner', reads: () => reads, asked })
  // A filter changed on the second page goes back to the first (web W18).
  const { router } = openReads('?page=abc')
  await screen.findByRole('table', { name: 'Registro de dados' })
  const rows = rowTexts().map(([_, ...cells]) => cells)
  expect(rows).toEqual([
    ['Bruno Reis', 'Conexus em Conversasno Projeto Pedidos', 'sankhya_vendas', 'Lida', '1'],
    ['Bruno Reis', 'Conexus em Conversas', 'sankhya_clientes', 'Não encontrada', '–'],
    ['Bruno Reis', 'Conexus em Construir', 'Consulta', 'Recusada', '–'],
    ['Bruno Reis', 'Resumo semanal', 'sankhya_vendas', 'Recusada', '–'],
    ['Bruno Reis', 'Agente apagadonum Projeto apagado', 'sankhya_vendas', 'Lida', '1'],
    ['Bruno Reis', 'Conexus em Agentes', 'Matriz · lerPedidos', 'Não lida', '–'],
    ['Bruno Reis', 'App', 'Consulta', 'Recusada', '–'],
    ['Bruno Reis', 'App', 'Consulta', 'Não lida', '–'],
  ])
  expect(screen.getByText('Não encontrada').getAttribute('title')).toBe('NOT_IN_CATALOG')
  expect(rowTexts()[0]?.[0]).toMatch(/^hoje, \d\d:\d\d$/)
  await choose('Pessoa', 'Bruno Reis')
  await waitFor(() => expect(router.state.location.search).toEqual({ person: BRUNO.personId }))
  await choose('Resultado', 'Recusada')
  await waitFor(() =>
    expect(router.state.location.search).toEqual({ person: BRUNO.personId, outcome: 'REFUSED' }),
  )
  await waitFor(() => expect(asked.at(-1)).toBe(`?person=${BRUNO.personId}&outcome=REFUSED`))
  router.history.push(`/companies/${COMPANY.id}/settings/data-reads?outcome=NOT_FOUND`)
  await waitFor(() => expect(asked.at(-1)).toBe('?outcome=NOT_FOUND'))
  expect(screen.getByRole('combobox', { name: 'Resultado' }).textContent).toBe('Não encontrada')
})

test('no computador, Limpar os filtros aparece com um filtro ligado e linhas na tela', async () => {
  // Founder, "3. A": not only in the phone's sheet and the filtered empty state.
  readsHub({ as: 'owner', reads: () => [read()] })
  const { router } = openReads('?person=person-bruno&agent=ASSISTANT')
  await screen.findByRole('table', { name: 'Registro de dados' })
  fireEvent.click(screen.getByRole('link', { name: 'Limpar os filtros' }))
  await waitFor(() => expect(router.state.location.search).toEqual({}))
  await screen.findByRole('table', { name: 'Registro de dados' })
  expect(screen.queryByRole('link', { name: 'Limpar os filtros' })).toBeNull()
})

test('a linha aberta', async () => {
  const mine = read({
    ...{ person: { id: ANA.id, name: ANA.name }, threadId: THREAD, verb: 'QUERY' },
    ...{ query: 'select count(*) from sync.sankhya_vendas', outcome: 'QUERY', rows: 3, ms: 40 },
  })
  const theirs = read({ threadId: THREAD, project: { id: PEDIDOS.id, name: 'Pedidos' } })
  const app = read({ agent: 'APP', verb: 'QUERY', tables: [], query: 'select 2', outcome: 'ROWS' })
  const live = read({
    ...{ agent: 'CONSTRUTOR', verb: 'LIVE', tables: [], connection: MATRIZ },
    ...{ operation: 'lerPedidos', outcome: 'OK', rows: null },
  })
  readsHub({ as: 'owner', reads: () => [mine, theirs, app, live] })
  const first = openReads(`?read=${mine.id}`)
  const panel = await screen.findByRole('dialog')
  const open = within(panel)
  expect(open.getByRole('heading').textContent).toMatch(/^Leitura de hoje, \d\d:\d\d$/)
  const facts = Array.from(panel.querySelectorAll('dt')).map((dt) => dt.textContent)
  expect(facts).toEqual([
    'Quem',
    'Agente',
    'Conversa',
    'Tabelas',
    'Consulta',
    'Resultado',
    'Linhas',
    'Tempo',
  ])
  expect(open.getByText('no Início')).toBeTruthy()
  expect(open.getByRole('link', { name: 'Abrir a conversa' }).getAttribute('href')).toBe(
    `/companies/${COMPANY.id}/conversations/${THREAD}`,
  )
  expect(open.getByRole('button', { name: 'Copiar a consulta' })).toBeTruthy()
  expect(open.getByText('40 ms')).toBeTruthy()
  first.unmount()
  const { unmount } = openReads(`?read=${theirs.id}`)
  const other = within(await screen.findByRole('dialog'))
  expect(other.getByText('no Projeto Pedidos')).toBeTruthy()
  expect(other.queryByRole('link', { name: 'Abrir a conversa' })).toBeNull()
  expect(other.queryByRole('button', { name: 'Copiar a consulta' })).toBeNull()
  fireEvent.click(other.getByRole('button', { name: 'Fechar' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  unmount()
  async function factsOf(id: string) {
    const opened = openReads(`?read=${id}`)
    const panel = await screen.findByRole('dialog')
    await within(panel).findByText('Tempo')
    const terms = Array.from(panel.querySelectorAll('dt')).map((dt) => dt.textContent)
    return { terms, panel: within(panel), unmount: opened.unmount }
  }
  // A query that named no table shows its query, with no "Tabelas" that repeats it (QA, finding 4).
  const queried = await factsOf(app.id)
  expect(queried.terms).toEqual(['Quem', 'Agente', 'Consulta', 'Resultado', 'Linhas', 'Tempo'])
  queried.unmount()
  const operated = await factsOf(live.id)
  expect(operated.terms).toEqual(['Quem', 'Agente', 'Operação', 'Resultado', 'Linhas', 'Tempo'])
  expect(operated.panel.getByText('Matriz · lerPedidos')).toBeTruthy()
})

test('uma leitura que não está na página, pelo endereço: Leitura não encontrada.', async () => {
  readsHub({ as: 'owner', reads: () => [read()] })
  openReads('?read=12345678-1234-4234-8234-123456789012')
  const open = within(await screen.findByRole('dialog'))
  expect(open.getByRole('heading', { name: 'Leitura não encontrada.' })).toBeTruthy()
})

test('os três estados: vazio, filtrado sem nada e o Hub calado', async () => {
  readsHub({ as: 'owner', reads: () => [] })
  const { unmount } = openReads()
  expect(await screen.findByText('Nenhuma leitura ainda.')).toBeTruthy()
  expect(
    screen.getByText(
      'Cada leitura que um agente ou um app fizer do dado da empresa aparece aqui, sem o resultado.',
    ),
  ).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Exportar' }).hasAttribute('disabled')).toBe(true)
  unmount()
  const asked: string[] = []
  readsHub({ as: 'owner', reads: () => [], asked })
  const filtered = openReads('?agent=APP')
  expect(await screen.findByText('Nenhuma leitura com esses filtros.')).toBeTruthy()
  fireEvent.click(screen.getByRole('link', { name: 'Limpar os filtros' }))
  await waitFor(() => expect(filtered.router.state.location.search).toEqual({}))
  filtered.unmount()
  let silent = true
  readsHub({ as: 'owner', reads: () => (silent ? refusal('DATABASE_UNAVAILABLE') : [read()]) })
  openReads()
  expect(await screen.findByText('Não deu para ler o registro agora.')).toBeTruthy()
  silent = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('table', { name: 'Registro de dados' })).toBeTruthy()
})

test('carregando: o quadro fica e as linhas são esqueletos', async () => {
  let answer: (reads: ReturnType<typeof read>[]) => void = () => undefined
  const held = new Promise<ReturnType<typeof read>[]>((resolve) => {
    answer = resolve
  })
  readsHub({ as: 'owner' })
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/data-reads`, async () =>
      HttpResponse.json({ reads: await held, next: { kind: 'END' } }),
    ),
  )
  openReads()
  const waiting = await screen.findByRole('status', { name: 'Carregando' })
  expect(waiting.querySelectorAll('[data-slot=skeleton]')).toHaveLength(6)
  expect(screen.getByRole('navigation', { name: 'Navegação' })).toBeTruthy()
  answer([read()])
  expect(await screen.findByRole('table', { name: 'Registro de dados' })).toBeTruthy()
})
