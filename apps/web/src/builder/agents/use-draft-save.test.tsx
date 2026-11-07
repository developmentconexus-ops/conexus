import { ConnectionId, DraftPatch, ToolId, ToolVersionId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT, AREA, agent, FILIAL, MATRIZ, TOOL_V1 } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// A fila de gravação do rascunho do agente (step 24.3, U5, criterion 27).
const server = hubServer()
const { at } = agentScreens(server)
const PAGE = `${AREA}/${AGENT}`
const OLD = 'Outra pessoa ou o Construtor mudou este rascunho. Recarregue.'

function textOf(field: HTMLElement) {
  if (!(field instanceof HTMLTextAreaElement)) throw new Error('the field is a textarea')
  return field.value
}

function isDisabled(button: HTMLElement) {
  return button.hasAttribute('disabled') || button.getAttribute('aria-disabled') === 'true'
}

test('duas gravações seguidas da mesma pessoa levam o revision que a anterior devolveu', async () => {
  const hub = at(PAGE, { agents: [agent({ revision: 3 })] })
  const memory = await screen.findByRole('switch', { name: 'Memória observacional' })
  fireEvent.click(memory)
  const field = screen.getByRole('textbox', { name: 'Instruções' })
  fireEvent.change(field, { target: { value: 'Seja breve.' } })
  fireEvent.blur(field)
  await waitFor(() => expect(hub.writes()).toHaveLength(2))
  expect(hub.writes().map((one) => DraftPatch.parse(one.body).revision)).toEqual([3, 4])
  expect(screen.queryByText(OLD)).toBeNull()
})

test('ligar a Matriz e logo a Filial, antes de a primeira gravação voltar, grava as duas', async () => {
  const offered = agent().offered[0]
  if (offered === undefined) throw new Error('the fixture offers the Matriz')
  const hub = at(PAGE, {
    agents: [
      agent({
        draft: { ...agent().draft, connections: [] },
        offered: [offered, { ...offered, connectionId: FILIAL, name: 'Filial' }],
      }),
    ],
  })
  const links = await screen.findByRole('region', { name: 'Ligações' })
  fireEvent.click(await within(links).findByRole('checkbox', { name: 'Sankhya · Matriz' }))
  fireEvent.click(within(links).getByRole('checkbox', { name: 'Sankhya · Filial' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(2))
  expect(DraftPatch.parse(hub.writes()[1]?.body).connections).toEqual([MATRIZ, FILIAL])
  expect(screen.queryByRole('alert')).toBeNull()
})

test('três ligações seguidas, com a segunda gravação em voo, gravam as três', async () => {
  const offered = agent().offered[0]
  if (offered === undefined) throw new Error('the fixture offers the Matriz')
  const loja = ConnectionId.parse('cccccccc-aaaa-4aaa-8aaa-cccccccccccc')
  let calls = 0
  let release: (() => void) | undefined
  const hub = at(PAGE, {
    agents: [
      agent({
        draft: { ...agent().draft, connections: [] },
        offered: [
          offered,
          { ...offered, connectionId: FILIAL, name: 'Filial' },
          { ...offered, connectionId: loja, name: 'Loja' },
        ],
      }),
    ],
    answers: {
      save: () =>
        ++calls === 2
          ? new Promise<undefined>((resolve) => {
              release = () => resolve(undefined)
            })
          : undefined,
    },
  })
  const links = await screen.findByRole('region', { name: 'Ligações' })
  function on(name: string) {
    return within(links).getByRole('checkbox', { name }).getAttribute('aria-checked')
  }
  fireEvent.click(await within(links).findByRole('checkbox', { name: 'Sankhya · Matriz' }))
  fireEvent.click(within(links).getByRole('checkbox', { name: 'Sankhya · Filial' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(2))
  await waitFor(() => expect(on('Sankhya · Filial')).toBe('true'))
  fireEvent.click(within(links).getByRole('checkbox', { name: 'Sankhya · Loja' }))
  release?.()
  await waitFor(() => expect(hub.writes()).toHaveLength(3))
  expect(DraftPatch.parse(hub.writes()[2]?.body).connections).toEqual([MATRIZ, FILIAL, loja])
})

test('três ferramentas tiradas seguidas, com a segunda gravação em voo, não voltam', async () => {
  function tool(digit: string, slug: string) {
    const [base] = agent().tools
    if (base?.kind !== 'PRESET') throw new Error('the fixture has a preset tool')
    const versionId = ToolVersionId.parse(`${digit.repeat(8)}-cccc-4ccc-8ccc-${digit.repeat(12)}`)
    return {
      ...base,
      id: ToolId.parse(`${digit.repeat(8)}-bbbb-4bbb-8bbb-${digit.repeat(12)}`),
      slug,
      latest: { id: versionId, number: 1 },
      version: { ...base.version, id: versionId, description: slug },
    }
  }
  const held = agent({ tools: [tool('1', 'um'), tool('2', 'dois'), tool('3', 'tres')] })
  let release: (() => void) | undefined
  const sent: DraftPatch[] = []
  at(PAGE, { agents: [held] })
  // The unit's hub keeps the tools on a save; this one applies them, as the Hub does.
  server.use(
    http.patch(
      `*/api/companies/${COMPANY.id}/projects/:p/agents/:id/draft`,
      async ({ request }) => {
        const body = DraftPatch.parse(await request.json())
        sent.push(body)
        if (sent.length === 2) {
          await new Promise<void>((resolve) => {
            release = resolve
          })
        }
        held.revision += 1
        held.tools = held.tools.filter((one) => body.tools?.includes(one.version.id) ?? true)
        return HttpResponse.json({ agent: held })
      },
    ),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Tirar um' }))
  fireEvent.click(screen.getByRole('button', { name: 'Tirar dois' }))
  await waitFor(() => expect(sent).toHaveLength(2))
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Tirar dois' })).toBeNull())
  fireEvent.click(screen.getByRole('button', { name: 'Tirar tres' }))
  release?.()
  await waitFor(() => expect(sent).toHaveLength(3))
  expect(sent[2]?.tools).toEqual([])
})

test('a gravação das instruções falha, outra seção grava, e o aviso fica nas Instruções', async () => {
  let calls = 0
  const hub = at(PAGE, {
    agents: [agent()],
    answers: { save: () => (++calls === 1 ? HttpResponse.error() : undefined) },
  })
  const section = await screen.findByRole('region', { name: 'Instruções' })
  const field = within(section).getByRole('textbox', { name: 'Instruções' })
  fireEvent.change(field, { target: { value: 'Texto novo que não gravou.' } })
  fireEvent.blur(field)
  expect(await within(section).findByRole('alert')).toBeTruthy()
  fireEvent.click(screen.getByRole('switch', { name: 'Memória observacional' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(2))
  await waitFor(() =>
    expect(
      screen.getByRole('switch', { name: 'Memória observacional' }).getAttribute('aria-checked'),
    ).toBe('false'),
  )
  expect(within(section).getByRole('alert').textContent).toBe(
    'Não confirmamos a gravação. Confira o painel e tente de novo.',
  )
  expect(textOf(within(section).getByRole('textbox', { name: 'Instruções' }))).toBe(
    'Texto novo que não gravou.',
  )
})

test('Usar as escolhidas espera a lista chegar, e mantém a escolhida que a lista não traz', async () => {
  let release: (() => void) | undefined
  const hub = at(PAGE, {
    agents: [agent()],
    answers: {
      tools: () =>
        release === undefined
          ? new Promise((resolve) => {
              release = () => resolve(HttpResponse.json({ tools: [], ready: [] }))
            })
          : undefined,
    },
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Adicionar da biblioteca' }))
  const dialog = await screen.findByRole('dialog')
  function use() {
    return within(dialog).getByRole('button', { name: 'Usar as escolhidas' })
  }
  expect(isDisabled(use())).toBe(true)
  await waitFor(() => expect(release).toBeDefined())
  release?.()
  await waitFor(() => expect(isDisabled(use())).toBe(false))
  fireEvent.click(use())
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(DraftPatch.parse(hub.writes()[0]?.body).tools).toEqual([TOOL_V1])
})

test('o que a pessoa digita enquanto a gravação anterior está em voo fica no campo', async () => {
  let release: (() => void) | undefined
  at(PAGE, {
    agents: [agent()],
    answers: {
      save: () =>
        new Promise<undefined>((resolve) => {
          release = () => resolve(undefined)
        }),
    },
  })
  const section = await screen.findByRole('region', { name: 'Instruções' })
  const field = within(section).getByRole('textbox', { name: 'Instruções' })
  fireEvent.change(field, { target: { value: 'Seja breve.' } })
  fireEvent.blur(field)
  function busy() {
    return section.querySelector('[aria-busy="true"]') !== null
  }
  await waitFor(() => expect(busy()).toBe(true))
  fireEvent.change(field, { target: { value: 'Seja breve. E educado.' } })
  release?.()
  await waitFor(() => expect(busy()).toBe(false))
  expect(textOf(within(section).getByRole('textbox', { name: 'Instruções' }))).toBe(
    'Seja breve. E educado.',
  )
})
