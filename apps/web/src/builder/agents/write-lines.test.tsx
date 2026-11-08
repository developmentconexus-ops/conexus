import { FAILURES, PROBLEM_MEDIA_TYPE, ToolVersionId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { problemOf } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT, AREA, TOOL } from './test-agents.ts'
import { writer } from './test-connection-tools.ts'
import { agentScreens } from './test-hub.tsx'
import { catalog } from './test-hub-tools.tsx'

// A escrita na linha da página do agente (step 24.5, U6, criterion 42).
const server = hubServer()
const { at } = agentScreens(server)
const PAGE = `${AREA}/${AGENT}`
const NEWER = ToolVersionId.parse('55555555-aaaa-4aaa-8aaa-555555555555')
const NOT_FIXED =
  'Esta operação pede um valor fixo de quem configura. Preencha-o nos valores fixos da ferramenta.'

/** The agent with its write already on a newer version of the library. */
function behind(approval: 'ASK' | 'AUTO') {
  const { tools, ...rest } = writer(approval)
  return { ...rest, tools: tools.map((one) => ({ ...one, latest: { id: NEWER, number: 2 } })) }
}

test.each([
  ['ASK', 'Pergunta antes'],
  ['AUTO', 'Faz sozinho'],
] as const)(
  'a escrita usa a versão nova: Usar a versão 2 grava só a versão, e a chave %s fica em %s, sem desmarcar a linha',
  async (approval, label) => {
    let release: () => void = () => undefined
    const gate = new Promise<void>((done) => {
      release = done
    })
    const hub = at(PAGE, {
      agents: [behind(approval)],
      answers: { save: async () => void (await gate) },
    })
    server.use(catalog)
    fireEvent.click(await screen.findByRole('button', { name: 'Usar a versão 2' }))
    await waitFor(() => expect(hub.writes()).toHaveLength(1))
    expect(hub.writes()[0]?.body).toMatchObject({ tools: [NEWER], revision: 3 })
    expect(JSON.stringify(hub.writes()[0]?.body)).not.toContain('approvals')
    // While the Hub has not answered, the line is still marked and the key is where it was.
    const key = within(screen.getByRole('group', { name: 'Quando Lançar pedido roda' }))
    expect(key.getByRole('button', { name: label }).getAttribute('aria-pressed')).toBe('true')
    expect(
      screen.getByRole('checkbox', { name: /Lançar pedido/ }).getAttribute('aria-checked'),
    ).toBe('true')
    release()
  },
)

test('o campo fixo sem valor: se a publicação o recusa, a linha de Lançar pedido diz o texto', async () => {
  at(PAGE, {
    agents: [writer('ASK')],
    answers: {
      publish: () =>
        HttpResponse.json(
          { ...problemOf('AGENT_TOOL_REFUSED'), field: 'tools', reason: 'NOT_FIXED' },
          {
            status: FAILURES.AGENT_TOOL_REFUSED.status,
            headers: { 'content-type': PROBLEM_MEDIA_TYPE },
          },
        ),
    },
  })
  server.use(catalog)
  expect(await screen.findByRole('group', { name: 'Quando Lançar pedido roda' })).toBeTruthy()
  expect(screen.queryByText(NOT_FIXED)).toBeNull()
  fireEvent.click(await screen.findByRole('button', { name: /^Publicar v\d/ }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar versão' }))
  expect(await within(dialog).findByText(NOT_FIXED)).toBeTruthy()
  expect(screen.getAllByText(NOT_FIXED)).toHaveLength(2)
  expect(TOOL).toBeTruthy()
})
