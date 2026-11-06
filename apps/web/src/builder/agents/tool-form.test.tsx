import { FAILURES, PROBLEM_MEDIA_TYPE, ToolVersionId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { problemOf } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS } from '../../platform/test-hub.tsx'
import { AGENT, AREA, agent, TOOL, TOOL_V1, toolSummary } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// O formulário da ferramenta criada no painel (step 24.3, U5, criterion 27; web W24, code C37).
const server = hubServer()
const { at } = agentScreens(server)

test('a resposta de criar a ferramenta se perde: tocar de novo leva a mesma chave', async () => {
  let calls = 0
  const hub = at(`${AREA}/${AGENT}`, {
    agents: [agent()],
    answers: { createTool: () => (++calls === 1 ? HttpResponse.error() : undefined) },
  })
  const panel = await screen.findByRole('region', { name: 'Ferramentas' })
  fireEvent.click(await within(panel).findByRole('button', { name: 'Criar' }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nome da ferramenta'), {
    target: { value: 'pedidos_de_ontem' },
  })
  fireEvent.change(within(dialog).getByLabelText('O que ela faz'), {
    target: { value: 'Pedidos de ontem.' },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Criar ferramenta' }))
  expect(await within(dialog).findByRole('alert')).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Criar ferramenta' }))
  await waitFor(() =>
    expect(hub.writes().filter((one) => one.path.endsWith('/tools'))).toHaveLength(2),
  )
  const keys = hub
    .writes()
    .filter((one) => one.path.endsWith('/tools'))
    .map((one) => one.key)
  expect(keys[0]).not.toBeNull()
  expect(keys[1]).toBe(keys[0])
})

test('a descrição vazia ou de 501 caracteres diz a regra junto do campo, e valores fixos que não são JSON, em português, sem gravar nada', async () => {
  const hub = at(`${AREA}/${AGENT}`, { agents: [agent()] })
  const panel = await screen.findByRole('region', { name: 'Ferramentas' })
  fireEvent.click(await within(panel).findByRole('button', { name: 'Criar' }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nome da ferramenta'), {
    target: { value: 'pedidos_de_ontem' },
  })
  const create = within(dialog).getByRole('button', { name: 'Criar ferramenta' })
  const description = within(dialog).getByLabelText('O que ela faz')
  const rule = 'Escreva o que a ferramenta faz, em até 500 caracteres.'
  fireEvent.click(create)
  expect(await within(dialog).findByText(rule)).toBeTruthy()
  fireEvent.change(description, { target: { value: 'a'.repeat(501) } })
  fireEvent.click(create)
  expect(await within(dialog).findByText(rule)).toBeTruthy()
  fireEvent.change(description, { target: { value: 'Pedidos de ontem.' } })
  fireEvent.change(within(dialog).getByLabelText('Valores fixos (JSON)'), {
    target: { value: '{' },
  })
  fireEvent.click(create)
  expect(
    await within(dialog).findByText('Os valores fixos não são um JSON de campos.'),
  ).toBeTruthy()
  expect(hub.writes().filter((one) => one.path.endsWith('/tools'))).toHaveLength(0)
})

test('o Hub recusa um campo aberto repetido (FIELD_TWICE): a frase diz o que houve, junto do campo', async () => {
  at(`${AREA}/${AGENT}`, {
    agents: [agent()],
    answers: {
      createTool: () =>
        HttpResponse.json(
          { ...problemOf('TOOL_REFUSED'), field: 'open', reason: 'FIELD_TWICE' },
          {
            status: FAILURES.TOOL_REFUSED.status,
            headers: { 'content-type': PROBLEM_MEDIA_TYPE },
          },
        ),
    },
  })
  const panel = await screen.findByRole('region', { name: 'Ferramentas' })
  fireEvent.click(await within(panel).findByRole('button', { name: 'Criar' }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nome da ferramenta'), {
    target: { value: 'pedidos_de_ontem' },
  })
  fireEvent.change(within(dialog).getByLabelText('O que ela faz'), {
    target: { value: 'Pedidos de ontem.' },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Criar ferramenta' }))
  expect(
    await within(dialog).findByText(
      'Um campo aparece duas vezes: repetido nos que o modelo preenche, ou também nos valores fixos.',
    ),
  ).toBeTruthy()
})

test('outra aba gravou uma versão no meio (STALE_VERSION): a tela diz que há versão mais nova e Recarregar abre o formulário sobre a versão de agora', async () => {
  const V2 = ToolVersionId.parse('44444444-aaaa-4aaa-8aaa-555555555555')
  const held = {
    agents: [agent()],
    tools: [toolSummary()],
    toolVersions: [
      {
        ...{ kind: 'PRESET' as const, id: TOOL_V1, number: 1 },
        ...{ description: 'Vendas de ontem por vendedor.', bound: {}, open: [] },
      },
    ],
  }
  at(`${AREA}/tools/${TOOL}`, held)
  server.use(
    http.post(
      `*/api/companies/*/projects/${PEDIDOS.id}/tools/:toolId/versions`,
      () =>
        HttpResponse.json(
          { ...problemOf('TOOL_REFUSED'), field: 'toolId', reason: 'STALE_VERSION' },
          { status: FAILURES.TOOL_REFUSED.status, headers: { 'content-type': PROBLEM_MEDIA_TYPE } },
        ),
      { once: true },
    ),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Nova versão' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Gravar versão' }))
  const newer = 'Há uma versão mais nova desta ferramenta.'
  expect(await screen.findByText(newer)).toBeTruthy()

  // The other tab's version is the Hub's latest now.
  held.toolVersions.push({
    ...{ kind: 'PRESET' as const, id: V2, number: 2 },
    ...{ description: 'Da outra aba.', bound: {}, open: [] },
  })
  Object.assign(held.tools[0] ?? {}, {
    latest: { id: V2, number: 2 },
    description: 'Da outra aba.',
  })
  fireEvent.click(screen.getByRole('button', { name: 'Recarregar' }))
  await waitFor(() => expect(screen.queryByText(newer)).toBeNull())
  const description = await screen.findByLabelText('O que ela faz')
  expect(description).toHaveProperty('value', 'Da outra aba.')
})
