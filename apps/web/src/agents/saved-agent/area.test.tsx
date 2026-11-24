import { fireEvent, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { onPhone } from '../../harness/room/test-hub.tsx'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { AREA, agent, OTHER_AGENT, THIRD_AGENT } from './test-agents.ts'
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

test('o membro: o endereço da área dá não encontrado', async () => {
  at(AREA, { agents: [], member: true }, { role: 'member' })
  expect(await screen.findByText(/Não encontramos o que você procurou\./)).toBeTruthy()
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
