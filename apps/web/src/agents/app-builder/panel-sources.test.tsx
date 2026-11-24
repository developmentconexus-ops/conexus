import { CompanyId, listConnections } from '@conexus/hub-api'
import { screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test, vi } from 'vitest'
import { wordsOf } from '../../harness/room/connector-words.ts'
import { appBuilderRoom } from '../../harness/room/room.ts'
import { conversationOf, FIRST, screens } from '../../harness/room/test-hub.tsx'
import { recordedRun } from '../../harness/room/test-recorded.ts'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { KIT_SANKHYA } from '../../platform/test-kit.ts'

const server = hubServer()
const { openConversation } = screens(server)

const ASKED = recordedRun('reads').read.findLast((message) => message.role === 'assistant')

function catalogRead(connectors: (typeof KIT_SANKHYA)[]) {
  server.use(
    http.get('*/api/companies/:companyId/connections', () =>
      HttpResponse.json(
        listConnections.success.body.parse({ connectors, connections: [], mayManage: true }),
      ),
    ),
  )
}

/** The recorded live read's answer, opened in a Builder conversation with the catalog `connectors`. */
async function askedIn(connectors: (typeof KIT_SANKHYA)[]) {
  if (ASKED === undefined) throw new Error('the recording holds no answer')
  const message = structuredClone(ASKED)
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

test('a sala do Builder toma do catálogo o nome e a logo, e a recusa de conector segue a do Builder', () => {
  const room = appBuilderRoom(wordsOf([KIT_SANKHYA]), CompanyId.parse(COMPANY.id))
  expect(room.connectors.name('sankhya')).toBe('Sankhya')
  expect(room.connectors.logo('sankhya')).toBe(KIT_SANKHYA.logo)
  expect(room.connectors.refusal('sankhya', { kind: 'UNREACHABLE' })).toBe(
    'Não conseguiu ler o sistema da empresa.',
  )
})
