import { DraftPatch } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { choose } from '../conversation/test-hub.tsx'
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

test('duas gravações seguidas da mesma pessoa levam o revision que a anterior devolveu', async () => {
  const hub = at(PAGE, { agents: [agent({ revision: 3 })] })
  const panel = await screen.findByRole('region', { name: 'Configuração' })
  const memory = await within(panel).findByRole('switch', { name: 'Memória observacional' })
  fireEvent.click(memory)
  fireEvent.click(await within(panel).findByRole('switch', { name: 'Lê a web' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(2))
  expect(hub.writes().map((one) => DraftPatch.parse(one.body).revision)).toEqual([3, 4])
  expect(screen.queryByText(OLD)).toBeNull()
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
  expect(await screen.findByRole('checkbox', { name: /vendas_de_ontem/ })).toBeTruthy()
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
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar' }))
  const dialog = await screen.findByRole('alertdialog')
  expect(
    within(dialog).getByText(/conversas de todas as pessoas com ele e as automações que o rodam/),
  ).toBeTruthy()
  expect(writes()).toHaveLength(0)
  fireEvent.click(within(dialog).getByRole('button', { name: 'Apagar agente' }))
  await waitFor(() => expect(conexus.router.state.location.pathname).toBe(AREA))
  expect(writes()[0]?.method).toBe('DELETE')
})
