import { FAILURES, PROBLEM_MEDIA_TYPE } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { connectionOf } from '../../hub/connectors/fixtures.ts'
import { COMPANY, problemOf } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { SANKHYA } from '../assistant/test-hub.tsx'
import { choose, onPhone } from '../conversation/test-hub.tsx'
import {
  AGENT,
  AREA,
  agent,
  CHAT,
  MATRIZ,
  OTHER_AGENT,
  TEST_CHAT,
  toolSummary,
  version,
} from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// A página do agente (step 24.3, U5, criteria 27 and 28).
const server = hubServer()
const { at } = agentScreens(server)
const PAGE = `${AREA}/${AGENT}`
const OLD = 'Outra pessoa ou o Construtor mudou este rascunho. Recarregue.'

test('muda o modelo no painel, o servidor diz AGENT_DRAFT_STALE e a página mostra a frase', async () => {
  at(PAGE, { agents: [agent()], answers: { save: () => refusal('AGENT_DRAFT_STALE') } })
  const panel = await screen.findByRole('region', { name: 'Modelo' })
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
  fireEvent.click(await screen.findByRole('button', { name: /^Publicar v\d/ }))
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
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar da biblioteca' }))
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
  fireEvent.click(await screen.findByRole('button', { name: /^Publicar v\d/ }))
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
  fireEvent.click(await screen.findByRole('button', { name: /^Publicar v\d/ }))
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

test('no celular as abas são Configuração e Conversas, nessa ordem, e Versões é uma seção da página', async () => {
  await onPhone(async () => {
    at(PAGE, { agents: [agent()] })
    const tabs = await screen.findAllByRole('tab')
    expect(tabs.map((one) => one.textContent)).toEqual(['Configuração', 'Conversas'])
    expect(await screen.findByRole('region', { name: 'Versões' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações: Conferente de metas' }))
    expect((await screen.findAllByRole('menuitem')).map((one) => one.textContent)).toEqual([
      'Apagar',
    ])
  })
})

test('a configuração é a página: as seções são regiões e não há a seção Lê nem a coluna das conversas', async () => {
  at(PAGE, { agents: [agent()] })
  for (const name of ['Instruções', 'Modelo', 'Memória', 'Ferramentas', 'Ligações', 'Versões']) {
    expect(await screen.findByRole('region', { name })).toBeTruthy()
  }
  expect(screen.queryByRole('region', { name: 'Lê' })).toBeNull()
  expect(screen.queryByRole('complementary', { name: 'Conversas' })).toBeNull()
})

test('Pesquisar na web é uma ferramenta: ligar a chave na biblioteca manda { web: true } e a linha aparece em Ferramentas', async () => {
  const hub = at(PAGE, { agents: [agent({ tools: [] })] })
  const tools = await screen.findByRole('region', { name: 'Ferramentas' })
  fireEvent.click(within(tools).getByRole('button', { name: 'Adicionar da biblioteca' }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.click(await within(dialog).findByRole('switch', { name: 'Pesquisar na web' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(hub.writes()[0]?.body).toMatchObject({ web: true })
  expect(await within(tools).findByText('Pesquisar na web')).toBeTruthy()
})

test('a ligação mostra Funcionando', async () => {
  at(PAGE, { agents: [agent()] })
  server.use(
    http.get('*/api/companies/:companyId/connections', () =>
      HttpResponse.json({
        connectors: [SANKHYA],
        connections: [connectionOf({ id: MATRIZ, name: 'Matriz', state: 'ACTIVE' })],
        mayManage: true,
      }),
    ),
  )
  const connections = await screen.findByRole('region', { name: 'Ligações' })
  expect(await within(connections).findByText('Funcionando')).toBeTruthy()
})

test('Publicar diz a próxima versão', async () => {
  at(PAGE, {
    agents: [agent({ state: { kind: 'PUBLISHED', version: 1, changed: true } })],
    versions: [version(1, true)],
  })
  expect(await screen.findByRole('button', { name: 'Publicar v2' })).toBeTruthy()
})

test('Testar abre a conversa de teste no painel da direita', async () => {
  const { conexus } = at(PAGE, { agents: [agent()] })
  fireEvent.click(await screen.findByRole('button', { name: 'Testar' }))
  await waitFor(() => expect(conexus.router.state.location.pathname).toContain(TEST_CHAT))
  const panel = await screen.findByRole('region', { name: 'Testar' })
  expect(await within(panel).findByText('Conversa de teste com o rascunho')).toBeTruthy()
})

test('as conversas da pessoa ficam na troca do painel', async () => {
  const { conexus } = at(`${PAGE}/${TEST_CHAT}`, {
    agents: [agent()],
    conversations: [
      {
        id: CHAT,
        agentId: AGENT,
        draft: false,
        title: 'Metas de ontem',
        updatedAt: '2026-11-02T12:00:00.000Z',
      },
      {
        id: TEST_CHAT,
        agentId: AGENT,
        draft: true,
        title: '',
        updatedAt: '2026-11-02T12:00:00.000Z',
      },
    ],
  })
  const panel = await screen.findByRole('region', { name: 'Testar' })
  fireEvent.keyDown(await within(panel).findByRole('combobox', { name: 'Conversas' }), {
    key: 'ArrowDown',
  })
  const option = await screen.findByRole('option', { name: /Metas de ontem/ })
  for (const event of ['pointerDown', 'mouseDown', 'pointerUp', 'mouseUp', 'click'] as const) {
    fireEvent[event](option)
  }
  await waitFor(() => expect(conexus.router.state.location.pathname).toContain(CHAT))
})

test('o rascunho com mudanças aparece em Versões', async () => {
  at(PAGE, {
    agents: [agent({ state: { kind: 'PUBLISHED', version: 1, changed: true } })],
    versions: [version(1, true)],
  })
  const list = await screen.findByRole('region', { name: 'Versões' })
  expect(await within(list).findByText('Rascunho')).toBeTruthy()
  expect(await within(list).findByText('Ativa')).toBeTruthy()
})
