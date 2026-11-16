import type { CONNECTION_STATES } from '@conexus/hub-api'
import { DataResult, listConnections } from '@conexus/hub-api'
import { screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { KIT_SANKHYA } from '../../platform/test-kit.ts'
import { conversationOf, FIRST, screens } from './test-hub.tsx'
import { recordedRun } from './test-recorded.ts'

const server = hubServer()
const { openConversation } = screens(server)

const ASKED = recordedRun('data-query').read.findLast((message) => message.role === 'assistant')

function catalogRead(connectors: (typeof KIT_SANKHYA)[]) {
  server.use(
    http.get('*/api/companies/:companyId/connections', () =>
      HttpResponse.json(
        listConnections.success.body.parse({ connectors, connections: [], mayManage: true }),
      ),
    ),
  )
}

async function askedIn(
  connectors: (typeof KIT_SANKHYA)[],
  state: (typeof CONNECTION_STATES)[number] = 'ACTIVE',
) {
  if (ASKED === undefined) throw new Error('the recording holds no answer')
  const message = structuredClone(ASKED)
  for (const part of message.content.parts) {
    if (part.type !== 'tool-invocation') continue
    const result = DataResult.safeParse(part.toolInvocation.result)
    const systems = [{ kind: 'NAMED' as const, name: 'Matriz', state }]
    if (result.data?.kind === 'ROWS')
      part.toolInvocation.result = {
        ...result.data,
        origin: result.data.origin.map((one) => ({ ...one, systems })),
      }
    if (result.data?.kind === 'TABLE')
      part.toolInvocation.result = { ...result.data, origin: { ...result.data.origin, systems } }
  }
  catalogRead(connectors)
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-14T15:30:00.000Z') })
  try {
    await openConversation(conversationOf({ id: FIRST, messages: [message] }))
    return await screen.findByRole('region', { name: 'Fontes' })
  } finally {
    vi.useRealTimers()
  }
}

test('na conversa do Builder, a fonte tem o nome e a logo do catálogo', async () => {
  const sources = await askedIn([KIT_SANKHYA])
  await within(sources).findByText('Sankhya · Matriz')
  expect(sources.querySelector('img')?.getAttribute('src')).toContain(
    encodeURIComponent(KIT_SANKHYA.logo),
  )
})

test('sem o catálogo, a fonte do Builder nomeia o conector pelo id', async () => {
  const sources = await askedIn([])
  await within(sources).findByText('sankhya · Matriz')
  expect(sources.querySelector('img')).toBeNull()
})

test('na conversa do Builder, o selo de um conector de chaves diz Chaves recusadas, não as palavras de OAuth', async () => {
  const sources = await askedIn([KIT_SANKHYA], 'NEEDS_REAUTH')
  expect(await within(sources).findByText('Chaves recusadas')).toBeTruthy()
  expect(within(sources).queryByText('Pede para conectar de novo')).toBeNull()
})
