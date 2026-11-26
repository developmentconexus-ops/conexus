import { listAssistantConnections, listAssistantConversations } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { ASSISTANT_PATH } from './sweep-assistant-states.ts'
import { OWNER, projectsPage, startsOn } from './sweep-replies.ts'

const ASSISTANT_API = `/api/companies/${COMPANY.id}/assistant`
export const OPENED = ASSISTANT_PATH.split('/').at(-1) ?? ''
export const NOW = '2026-10-19T12:00:00.000Z'

/** The owner's Início with a few conversations in the list and in Continuar. */
export function owner(conversations: { id: string; title: string }[]): Replies {
  return {
    ...OWNER,
    ...projectsPage(COMPANY.id),
    ...startsOn(COMPANY.id),
    [`GET ${ASSISTANT_API}/connections`]: ok(listAssistantConnections, { connections: [] }),
    [`GET ${ASSISTANT_API}/conversations`]: ok(listAssistantConversations, {
      conversations: conversations.map((one) => ({
        ...one,
        createdAt: NOW,
        updatedAt: NOW,
        project: null,
        automation: null,
      })),
      next: { kind: 'END' },
    }),
  }
}

export function onlyList(replies: Replies): Replies {
  const key = `GET ${ASSISTANT_API}/conversations`
  const reply = replies[key]
  if (reply === undefined) throw new Error('the owner has no conversations reply')
  return { [key]: reply }
}

export const CONVERSATIONS = [
  { id: '33333333-3333-4333-8333-333333333333', title: 'Vendas da semana' },
  { id: '44444444-4444-4444-8444-444444444444', title: 'Metas da Matriz' },
]
