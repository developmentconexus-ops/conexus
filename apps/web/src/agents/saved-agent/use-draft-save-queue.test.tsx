import { ConnectionId, DraftPatch, OperationId, ToolId, ToolVersionId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT, AREA, agent, FILIAL, MATRIZ } from './test-agents.ts'
import { offered } from './test-connection-tools.ts'
import { agentScreens } from './test-hub.tsx'

// A fila de gravação do rascunho (web W12): o que a pessoa muda com uma gravação em voo não se perde.
const server = hubServer()
const { at } = agentScreens(server)
const PAGE = `${AREA}/${AGENT}`
const DRAFT = `*/api/companies/${COMPANY.id}/projects/:p/agents/:id/draft`
const AGENT_READ = `*/api/companies/${COMPANY.id}/projects/:p/agents/:id`
const LOJA_C = ConnectionId.parse('cccccccc-aaaa-4aaa-8aaa-cccccccccccc')
const LOJA_D = ConnectionId.parse('dddddddd-aaaa-4aaa-8aaa-dddddddddddd')
const LOJA_E = ConnectionId.parse('eeeeeeee-aaaa-4aaa-8aaa-eeeeeeeeeeee')

function offeredOf(...names: [ConnectionId | null, string][]) {
  const base = agent().offered[0]
  if (base === undefined) throw new Error('the fixture offers the Matriz')
  const { reads } = offered(MATRIZ, 'Matriz')
  return names.map(([id, name]) => ({
    ...base,
    connectionId: id ?? base.connectionId,
    name,
    reads,
  }))
}

async function switches() {
  const links = await screen.findByRole('region', { name: 'Ligações' })
  await within(links).findByRole('checkbox', { name: 'Sankhya · Matriz' })
  return (name: string) => within(links).getByRole('checkbox', { name: `Sankhya · ${name}` })
}

function inMatriz(name: RegExp) {
  return within(screen.getByRole('list', { name: 'Ferramentas de Matriz' })).getByRole('checkbox', {
    name,
  })
}

function checked(element: HTMLElement) {
  return element.getAttribute('aria-checked')
}

function toolOf(digit: string, slug: string, operation: string) {
  const [base] = agent().tools
  if (base?.kind !== 'PRESET') throw new Error('the fixture has a preset tool')
  const versionId = ToolVersionId.parse(`${digit.repeat(8)}-cccc-4ccc-8ccc-${digit.repeat(12)}`)
  return {
    ...base,
    operation: OperationId.parse(operation),
    id: ToolId.parse(`${digit.repeat(8)}-bbbb-4bbb-8bbb-${digit.repeat(12)}`),
    slug,
    latest: { id: versionId, number: 1 },
    version: { ...base.version, kind: 'PRESET' as const, id: versionId, description: slug },
  }
}

test('cinco ligações ligadas, a segunda gravação em voo: as cinco chegam ao Hub e continuam ligadas', async () => {
  let saves = 0
  const releases: (() => void)[] = []
  const hub = at(PAGE, {
    agents: [
      agent({
        draft: { ...agent().draft, connections: [] },
        tools: [],
        offered: offeredOf(
          [null, 'Matriz'],
          [FILIAL, 'Filial'],
          [LOJA_C, 'Loja C'],
          [LOJA_D, 'Loja D'],
          [LOJA_E, 'Loja E'],
        ),
      }),
    ],
    answers: {
      save: () =>
        ++saves === 2
          ? new Promise<undefined>((resolve) => releases.push(() => resolve(undefined)))
          : undefined,
    },
  })
  const sw = await switches()
  fireEvent.click(sw('Matriz'))
  fireEvent.click(sw('Filial'))
  await waitFor(() => expect(hub.writes()).toHaveLength(2))
  fireEvent.click(sw('Loja C'))
  fireEvent.click(sw('Loja D'))
  fireEvent.click(sw('Loja E'))
  await waitFor(() => expect(checked(sw('Loja E'))).toBe('true'))
  expect(['Matriz', 'Filial', 'Loja C', 'Loja D', 'Loja E'].map((n) => checked(sw(n)))).toEqual(
    Array(5).fill('true'),
  )
  releases[0]?.()
  await waitFor(() => expect(hub.writes()).toHaveLength(5))
  const bodies = hub.writes().map((one) => DraftPatch.parse(one.body))
  expect(bodies[4]?.connections).toEqual([MATRIZ, FILIAL, LOJA_C, LOJA_D, LOJA_E])
  expect(bodies.map((one) => one.revision)).toEqual([3, 4, 5, 6, 7])
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull())
  expect(['Matriz', 'Filial', 'Loja C', 'Loja D', 'Loja E'].map((n) => checked(sw(n)))).toEqual(
    Array(5).fill('true'),
  )
})

test('seções misturadas com a segunda gravação em voo: toda mudança chega ao Hub e fica na tela', async () => {
  const held = agent({
    draft: { ...agent().draft, connections: [MATRIZ] },
    offered: offeredOf([null, 'Matriz'], [FILIAL, 'Filial']),
    tools: [
      toolOf('1', 'um', 'pedidos'),
      toolOf('2', 'dois', 'contasAReceber'),
      toolOf('3', 'tres', 'consultar'),
    ],
  })
  const sent: DraftPatch[] = []
  const releases: (() => void)[] = []
  at(PAGE, { agents: [held] })
  server.use(
    http.patch(DRAFT, async ({ request }) => {
      const body = DraftPatch.parse(await request.json())
      sent.push(body)
      if (sent.length === 1) await new Promise<void>((resolve) => releases.push(resolve))
      if (body.revision !== held.revision)
        return HttpResponse.json({ stale: true }, { status: 409 })
      const { revision: _revision, tools, ready: _ready, ...fields } = body
      held.revision += 1
      held.draft = { ...held.draft, ...fields }
      if (tools) held.tools = held.tools.filter((one) => tools.includes(one.version.id))
      return HttpResponse.json({ agent: held })
    }),
  )
  const sw = await switches()
  await waitFor(() => inMatriz(/^Pedidos/))
  fireEvent.click(inMatriz(/^Pedidos/))
  await waitFor(() => expect(sent).toHaveLength(1))
  fireEvent.click(sw('Filial'))
  fireEvent.click(screen.getByRole('switch', { name: 'Memória observacional' }))
  fireEvent.click(inMatriz(/^Contas a receber/))
  const field = screen.getByRole('textbox', { name: 'Instruções' })
  fireEvent.change(field, { target: { value: 'Texto da fila.' } })
  fireEvent.blur(field)
  await waitFor(() =>
    expect(inMatriz(/^Contas a receber/).getAttribute('aria-checked')).toBe('false'),
  )
  releases[0]?.()
  await waitFor(() => expect(sent).toHaveLength(5))
  await waitFor(() => expect(held.draft.instructions).toBe('Texto da fila.'))
  expect(sent.map((one) => one.revision)).toEqual([3, 4, 5, 6, 7])
  expect(held.draft.connections).toEqual([MATRIZ, FILIAL])
  expect(held.draft.memory.observational).toBe(false)
  expect(held.tools.map((one) => one.slug)).toEqual(['tres'])
  expect(screen.queryByRole('alert')).toBeNull()
  expect(inMatriz(/^Pedidos/).getAttribute('aria-checked')).toBe('false')
  expect(
    screen.getByRole('switch', { name: 'Memória observacional' }).getAttribute('aria-checked'),
  ).toBe('false')
  expect(screen.getByRole('textbox', { name: 'Instruções' })).toHaveProperty(
    'value',
    'Texto da fila.',
  )
})

test('uma leitura do agente em voo quando a mudança seguinte começa não a apaga', async () => {
  const held = agent({
    draft: { ...agent().draft, connections: [] },
    tools: [],
    offered: offeredOf([null, 'Matriz'], [FILIAL, 'Filial'], [LOJA_C, 'Loja']),
  })
  at(PAGE, { agents: [held] })
  let reads = 0
  let saves = 0
  let releaseRead: (() => void) | undefined
  let releaseSave: (() => void) | undefined
  server.use(
    http.get(AGENT_READ, async () => {
      const snapshot = structuredClone(held)
      if (++reads === 2) await new Promise<void>((resolve) => (releaseRead = resolve))
      return HttpResponse.json({ agent: snapshot })
    }),
    http.patch(DRAFT, async ({ request }) => {
      const body = DraftPatch.parse(await request.clone().json())
      if (++saves === 2) await new Promise<void>((resolve) => (releaseSave = resolve))
      held.revision += 1
      const { revision: _revision, tools: _tools, ready: _ready, ...fields } = body
      held.draft = { ...held.draft, ...fields }
      return HttpResponse.json({ agent: held })
    }),
  )
  const sw = await switches()
  fireEvent.click(sw('Matriz'))
  await waitFor(() => expect(reads).toBe(2))
  fireEvent.click(sw('Filial'))
  await waitFor(() => expect(checked(sw('Filial'))).toBe('true'))
  releaseRead?.()
  await waitFor(() => expect(saves).toBe(2))
  expect(checked(sw('Filial'))).toBe('true')
  fireEvent.click(sw('Loja'))
  releaseSave?.()
  await waitFor(() => expect(saves).toBe(3))
  expect(held.draft.connections).toEqual([MATRIZ, FILIAL, LOJA_C])
})
