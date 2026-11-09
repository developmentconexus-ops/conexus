import { fireEvent, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { onPhone, say } from '../conversation/test-hub.tsx'
import { AREA, agent, BUILDER_CHAT, OTHER_AGENT, THIRD_AGENT } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// A área Agentes de um Projeto (step 24.3, U5, criteria 26 and 28).
const server = hubServer()
const { at } = agentScreens(server)

test('a área mostra a conversa com o Construtor e a lista dos agentes com o estado', async () => {
  at(AREA, {
    agents: [
      agent({ state: { kind: 'DRAFT' } }),
      agent({
        id: OTHER_AGENT,
        name: 'Resumo de estoque',
        state: { kind: 'PUBLISHED', version: 2, changed: false },
      }),
      agent({
        id: THIRD_AGENT,
        name: 'Cobrança',
        state: { kind: 'PUBLISHED', version: 1, changed: true },
      }),
    ],
  })
  expect(await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' })).toBeTruthy()
  expect(screen.getByText('Conte o que você quer que um agente faça.')).toBeTruthy()
  expect(await screen.findByRole('link', { name: /Conferente de metas/ })).toBeTruthy()
  expect(screen.getByText('Rascunho')).toBeTruthy()
  expect(screen.getByText('Versão 2 · publicada')).toBeTruthy()
  expect(screen.getByText('Rascunho com mudanças')).toBeTruthy()
})

test('sem agentes, a lista diz que nenhum existe ainda', async () => {
  at(AREA, { agents: [] })
  expect(await screen.findByText('Nenhum agente ainda.')).toBeTruthy()
})

test('mandar o primeiro pedido abre uma conversa com o Construtor e leva a ela', async () => {
  const { conexus, writes } = at(AREA, { agents: [] })
  say(
    await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' }),
    'quero um agente de vendas',
  )
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toBe(`${AREA}/construtor/${BUILDER_CHAT}`),
  )
  expect(writes()[0]?.path).toMatch(/construtor\/conversations$/)
  expect(writes()[0]?.body).toMatchObject({ model: 'anthropic/claude-sonnet-4' })
  expect(await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' })).toBeTruthy()
})

test('as conversas anteriores com o Construtor aparecem em lista', async () => {
  at(AREA, {
    agents: [],
    construtor: [
      {
        id: BUILDER_CHAT,
        title: 'Agente de vendas',
        createdAt: '2026-11-02T12:00:00.000Z',
        updatedAt: '2026-11-02T12:00:00.000Z',
      },
    ],
  })
  const link = await screen.findByRole('link', { name: /^Agente de vendas/ })
  expect(link.getAttribute('href')).toBe(`${AREA}/construtor/${BUILDER_CHAT}`)
})

test('uma conversa com o Construtor sem título leva o dia e a hora em que começou, não os da última mudança', async () => {
  at(AREA, {
    agents: [],
    construtor: [
      {
        id: BUILDER_CHAT,
        title: null,
        createdAt: '2026-11-01T15:00:00.000Z',
        updatedAt: '2026-11-02T12:00:00.000Z',
      },
    ],
  })
  const link = await screen.findByRole('link', { name: /^Conversa de 01\/11\/2026, 12:00/ })
  expect(link.getAttribute('href')).toBe(`${AREA}/construtor/${BUILDER_CHAT}`)
})

test('o membro: o endereço da área dá não encontrado', async () => {
  at(AREA, { agents: [], member: true }, { role: 'member' })
  expect(await screen.findByText(/Não encontramos o que você procurou\./)).toBeTruthy()
})

test('uma conversa com o Construtor de outra pessoa dá não encontrado', async () => {
  at(`${AREA}/construtor/${BUILDER_CHAT}`, { agents: [], construtor: [] })
  expect(await screen.findByText('Esta conversa não existe mais.')).toBeTruthy()
})

test('a lista que falha ao ler diz a frase da falha, e Tentar de novo lê outra vez', async () => {
  let failing = true
  at(AREA, {
    agents: [agent()],
    answers: { list: () => (failing ? refusal('DATABASE_UNAVAILABLE') : undefined) },
  })
  expect(await screen.findByText(/O banco do Conexus não respondeu\./)).toBeTruthy()
  failing = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('link', { name: /Conferente de metas/ })).toBeTruthy()
})

test('no celular a área é uma coluna com as abas Agentes e Ferramentas, e o agente está na lista', async () => {
  await onPhone(async () => {
    at(AREA, { agents: [agent()] })
    expect(await screen.findByRole('link', { name: /Conferente de metas/ })).toBeTruthy()
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Agentes',
      'Ferramentas',
    ])
    expect(screen.getByRole('textbox', { name: 'Mensagem para o Construtor' })).toBeTruthy()
    expect(screen.getAllByRole('heading', { name: 'Agentes' })).toHaveLength(1)
  })
})

test('a linha do agente mostra o que ele faz e as ferramentas', async () => {
  at(AREA, { agents: [agent()] })
  const link = await screen.findByRole('link', { name: /Conferente de metas/ })
  expect(link.textContent).toBe(
    'Conferente de metasCompara as vendas de ontem com as metas.1 ferramentaRascunho',
  )
})

test('publicado com mudanças mostra os dois estados', async () => {
  at(AREA, { agents: [agent({ state: { kind: 'PUBLISHED', version: 1, changed: true } })] })
  expect(await screen.findByText('Versão 1 · publicada')).toBeTruthy()
  expect(screen.getByText('Rascunho com mudanças')).toBeTruthy()
})

test('abrir a conversa com o Construtor sem conta para o modelo diz a frase com o caminho das contas', async () => {
  at(AREA, { agents: [], answers: { openConstrutor: () => refusal('MODEL_NO_ACCOUNT') } })
  say(
    await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' }),
    'quero um agente de vendas',
  )
  expect(
    await screen.findByText(
      'Você ainda não tem uma conta de modelo. Peça a quem administra a empresa ou ligue a sua.',
    ),
  ).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Minhas contas de modelo' })).toBeTruthy()
})

test('o modelo escolhido na caixa vai com o pedido que abre a conversa', async () => {
  const { writes } = at(AREA, { agents: [] })
  fireEvent.click(await screen.findByRole('combobox', { name: 'Modelo e raciocínio' }))
  fireEvent.click(await screen.findByRole('option', { name: 'Claude Opus 4' }))
  say(await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' }), 'um pedido')
  await waitFor(() => expect(writes()[0]?.body).toMatchObject({ model: 'anthropic/claude-opus-4' }))
})

test('na conversa, trocar o modelo manda o PUT do Construtor e o botão mostra o que o Hub guardou', async () => {
  const { writes } = at(`${AREA}/construtor/${BUILDER_CHAT}`, {
    agents: [],
    construtor: [
      {
        id: BUILDER_CHAT,
        title: 'Meu agente',
        createdAt: '2026-11-02T12:00:00.000Z',
        updatedAt: '2026-11-02T12:00:00.000Z',
      },
    ],
  })
  fireEvent.click(await screen.findByRole('combobox', { name: 'Modelo e raciocínio' }))
  fireEvent.click(await screen.findByRole('option', { name: 'Claude Opus 4' }))
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }).textContent).toMatch(
      /Opus/,
    ),
  )
  const [put] = writes()
  expect(put?.method).toBe('PUT')
  expect(put?.path).toMatch(new RegExp(`/construtor/conversations/${BUILDER_CHAT}/model$`))
  expect(put?.body).toMatchObject({ model: 'anthropic/claude-opus-4' })
})

test('a conversa com o Construtor sumir do Hub faz a lista ser lida de novo', async () => {
  const row = { id: BUILDER_CHAT, title: 'Meu agente', updatedAt: '2026-11-02T12:00:00.000Z' }
  let reads = 0
  let atGone = Number.POSITIVE_INFINITY
  at(`${AREA}/construtor/${BUILDER_CHAT}`, { agents: [], construtor: [row] })
  server.use(
    http.get('*/construtor/conversations', () => {
      reads += 1
      return HttpResponse.json({ conversations: [row] })
    }),
    http.get('*/stream', async () => {
      await new Promise((settled) => setTimeout(settled, 300))
      atGone = reads
      return refusal('CONVERSATION_NOT_FOUND')
    }),
  )
  await waitFor(() => expect(reads).toBeGreaterThan(atGone))
})
