import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT, AREA, MATRIZ, TOOL } from './test-agents.ts'
import { bare, readyOf, writer } from './test-connection-tools.ts'
import { agentScreens } from './test-hub.tsx'
import { catalog } from './test-hub-tools.tsx'

const server = hubServer()
const { at } = agentScreens(server)
const PAGE = `${AREA}/${AGENT}`

test('marcar todas as leituras marca as leituras do kit e deixa a consulta livre desmarcada', async () => {
  const one = bare()
  one.draft.connections = [MATRIZ]
  const hub = at(PAGE, { agents: [one], ready: readyOf(MATRIZ) })
  server.use(catalog)
  const section = within(await screen.findByRole('region', { name: 'Ligações' }))
  fireEvent.click(
    await section.findByRole('button', { name: 'Marcar todas as leituras de Matriz' }),
  )
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(hub.writes()[0]?.body).toMatchObject({
    tools: [],
    ready: [
      { connectionId: MATRIZ, operation: 'pedidos' },
      { connectionId: MATRIZ, operation: 'contasAReceber' },
    ],
  })
  expect(JSON.stringify(hub.writes()[0]?.body)).not.toContain('consultar')
})

test('a janela de Adicionar da biblioteca não oferece nenhuma leitura de ligação, nem a consulta livre', async () => {
  at(PAGE, { agents: [bare()], ready: readyOf(MATRIZ) })
  server.use(catalog)
  const tools = await screen.findByRole('region', { name: 'Ferramentas' })
  fireEvent.click(within(tools).getByRole('button', { name: 'Adicionar da biblioteca' }))
  const dialog = within(await screen.findByRole('dialog'))
  expect(await dialog.findByRole('switch', { name: 'Pesquisar na web' })).toBeTruthy()
  expect(dialog.queryByRole('switch', { name: /Pedidos|Consulta/ })).toBeNull()
})

test('a escrita na linha: no fim do grupo, desmarcada e marcada "escreve"; marcar todas as leituras não a marca; marcada, mostra a chave e Faz sozinho grava (critério 13)', async () => {
  const hub = at(PAGE, { agents: [writer()], ready: readyOf(MATRIZ) })
  server.use(catalog)
  const section = within(await screen.findByRole('region', { name: 'Ligações' }))
  const write = await section.findByRole('checkbox', { name: /Lançar pedido/ })
  expect(section.getAllByRole('checkbox').at(-1)).toBe(write)
  expect(write.getAttribute('aria-checked')).toBe('false')
  expect(section.getByText('escreve')).toBeTruthy()
  fireEvent.click(section.getByRole('button', { name: 'Marcar todas as leituras de Matriz' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(JSON.stringify(hub.writes()[0]?.body)).not.toContain('lancarPedido')
  fireEvent.click(write)
  await waitFor(() => expect(hub.writes()).toHaveLength(2))
  expect(hub.writes()[1]?.body).toMatchObject({ ready: [{ operation: 'lancarPedido' }] })
})

test('a chave da escrita marcada: começa em Pergunta antes, e Faz sozinho grava AUTO na ferramenta', async () => {
  const hub = at(PAGE, { agents: [writer('ASK')] })
  server.use(catalog)
  const key = within(await screen.findByRole('group', { name: 'Quando Lançar pedido roda' }))
  expect(key.getByRole('button', { name: 'Pergunta antes' }).getAttribute('aria-pressed')).toBe(
    'true',
  )
  fireEvent.click(key.getByRole('button', { name: 'Faz sozinho' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(hub.writes()[0]?.body).toMatchObject({ approvals: { [TOOL]: 'AUTO' } })
})

test('sem a ação de publicar o que faz sozinho, Faz sozinho fica desligada com o motivo', async () => {
  at(PAGE, { agents: [writer('ASK')] }, { role: 'developer' })
  server.use(catalog)
  const key = within(await screen.findByRole('group', { name: 'Quando Lançar pedido roda' }))
  expect(key.getByRole('button', { name: 'Faz sozinho' }).hasAttribute('disabled')).toBe(true)
  expect(screen.getByText('Seu papel não publica escrita que faz sozinha')).toBeTruthy()
})
