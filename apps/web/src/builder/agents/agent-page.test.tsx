import { FAILURES, PROBLEM_MEDIA_TYPE } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY, problemOf } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { choose, onPhone } from '../conversation/test-hub.tsx'
import { AGENT, AREA, agent, OTHER_AGENT, TEST_CHAT, toolSummary, version } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// A página do agente (step 24.3, U5, criteria 27 and 28).
const server = hubServer()
const { at } = agentScreens(server)
const PAGE = `${AREA}/${AGENT}`
const OLD = 'Outra pessoa ou o Construtor mudou este rascunho. Recarregue.'

test('muda o modelo no painel, o servidor diz AGENT_DRAFT_STALE e a página mostra a frase', async () => {
  at(PAGE, { agents: [agent()], answers: { save: () => refusal('AGENT_DRAFT_STALE') } })
  const panel = await screen.findByRole('region', { name: 'Configuração' })
  await choose(await within(panel).findByRole('combobox', { name: 'Modelo' }), 'Claude Opus 4')
  expect(await screen.findByText(OLD)).toBeTruthy()
})

test('as instruções gravam ao sair do campo, com o revision lido', async () => {
  const hub = at(PAGE, { agents: [agent()] })
  const field = await screen.findByRole('textbox', { name: 'Instruções' })
  fireEvent.change(field, { target: { value: 'Seja breve.' } })
  fireEvent.blur(field)
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(hub.writes()[0]?.body).toMatchObject({ instructions: 'Seja breve.', revision: 3 })
})

test('Testar rascunho abre a conversa de teste com a faixa', async () => {
  const { conexus } = at(PAGE, { agents: [agent()] })
  fireEvent.click(await screen.findByRole('button', { name: 'Testar rascunho' }))
  await waitFor(() => expect(conexus.router.state.location.pathname).toContain(TEST_CHAT))
  expect(await screen.findByText('Conversa de teste com o rascunho')).toBeTruthy()
  expect(
    await screen.findByRole('textbox', { name: 'Mensagem para o Conferente de metas' }),
  ).toBeTruthy()
})

test('Publicar pede a mensagem e mostra a versão', async () => {
  const hub = at(PAGE, { agents: [agent()] })
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar' }))
  fireEvent.change(await screen.findByRole('textbox', { name: 'Mensagem da versão' }), {
    target: { value: 'Primeira' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Publicar versão' }))
  expect(await screen.findByText('Versão 1 · publicada')).toBeTruthy()
  expect(hub.writes()[0]?.body).toEqual({ revision: 3, message: 'Primeira' })
})

test('Voltar para a versão 1 torna a 1 ativa', async () => {
  const hub = at(PAGE, {
    agents: [agent({ state: { kind: 'PUBLISHED', version: 2, changed: false } })],
    versions: [version(2, true, 'Segunda'), version(1, false, 'Primeira')],
  })
  const list = await screen.findByRole('region', { name: 'Versões' })
  fireEvent.click(await within(list).findByRole('button', { name: 'Voltar para a versão 1' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(hub.writes()[0]?.path).toContain('/versions/1/activate')
})

test('uma ligação que o Projeto não oferece mais é dita ao lado dela', async () => {
  const gone = agent()
  gone.offered = []
  at(PAGE, { agents: [gone] })
  expect(await screen.findByText('O Projeto não oferece mais')).toBeTruthy()
})

test('as ferramentas escolhidas aparecem, e a lista de Escolher traz as que o Projeto pode usar', async () => {
  at(PAGE, {
    agents: [agent({ tools: [] })],
    tools: [toolSummary()],
  })
  expect(
    await screen.findByText('Nenhuma ferramenta. Peça ao Construtor, escolha ou crie aqui.'),
  ).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Escolher' }))
  expect(await screen.findByRole('switch', { name: /Vendas de ontem por vendedor\./ })).toBeTruthy()
})

test('o membro: o endereço do agente dá não encontrado', async () => {
  at(PAGE, { agents: [agent()], member: true }, { role: 'member' })
  expect(await screen.findByText(/Não encontramos o que você procurou\./)).toBeTruthy()
})

test('um agente apagado ou de outro Projeto dá a página de não encontrado', async () => {
  at(`${AREA}/${OTHER_AGENT}`, { agents: [agent()] })
  expect(await screen.findByText(/Não encontramos o que você procurou\./)).toBeTruthy()
})

test('Apagar pede confirmação com o aviso das conversas e das automações, e leva à área', async () => {
  const { conexus, writes } = at(PAGE, { agents: [agent()] })
  fireEvent.click(await screen.findByRole('button', { name: /^Mais ações/ }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Apagar' }))
  const dialog = await screen.findByRole('alertdialog')
  expect(
    within(dialog).getByText(/conversas de todas as pessoas com ele e as automações que o rodam/),
  ).toBeTruthy()
  expect(writes()).toHaveLength(0)
  fireEvent.click(within(dialog).getByRole('button', { name: 'Apagar agente' }))
  await waitFor(() => expect(conexus.router.state.location.pathname).toBe(AREA))
  expect(writes()[0]?.method).toBe('DELETE')
})

test('a ferramenta é criada e a gravação do rascunho é recusada: o diálogo diz a recusa', async () => {
  at(PAGE, {
    agents: [agent({ tools: [] })],
    answers: { save: () => refusal('AGENT_DRAFT_STALE') },
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Criar' }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nome da ferramenta'), {
    target: { value: 'pedidos_de_ontem' },
  })
  fireEvent.change(within(dialog).getByLabelText('O que ela faz'), {
    target: { value: 'Pedidos de ontem.' },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Criar ferramenta' }))
  expect(await within(dialog).findByText(OLD)).toBeTruthy()
})

test('Publicar na página com AGENT_DRAFT_STALE diz a frase de recarregar', async () => {
  at(PAGE, { agents: [agent()], answers: { publish: () => refusal('AGENT_DRAFT_STALE') } })
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar' }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar versão' }))
  expect(await within(dialog).findByText(OLD)).toBeTruthy()
})

test('Publicar sem instruções diz o campo que falta, com a concordância certa', async () => {
  at(PAGE, {
    agents: [agent()],
    answers: {
      publish: () =>
        HttpResponse.json(
          { ...problemOf('AGENT_DRAFT_INVALID'), field: 'instructions' },
          {
            status: FAILURES.AGENT_DRAFT_INVALID.status,
            headers: { 'content-type': PROBLEM_MEDIA_TYPE },
          },
        ),
    },
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar' }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar versão' }))
  expect(await within(dialog).findByText('Faltam as instruções para publicar.')).toBeTruthy()
})

test('a seção Modelo diz a falha da leitura das contas, com Tentar de novo', async () => {
  at(PAGE, { agents: [agent()] })
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/model-accounts`, () => refusal('DATABASE_UNAVAILABLE')),
  )
  const model = await screen.findByRole('region', { name: 'Modelo' })
  expect(await within(model).findByText(/O banco do Conexus não respondeu\./)).toBeTruthy()
  expect(within(model).getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
})

test('no celular, Versões fica no menu ⋯', async () => {
  await onPhone(async () => {
    at(PAGE, { agents: [agent()] })
    fireEvent.click(await screen.findByRole('tab', { name: 'Configuração' }))
    expect(screen.queryByRole('region', { name: 'Versões' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações: Conferente de metas' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Versões' }))
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('Ainda não publicado.')).toBeTruthy()
  })
})
