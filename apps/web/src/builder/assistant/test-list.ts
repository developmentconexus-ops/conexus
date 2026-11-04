import type { AssistantConversation } from '@conexus/hub-api'
import { listAssistantConversations } from '@conexus/hub-api'
import { PEDIDOS } from '../../platform/test-hub.tsx'

/** A title as the Hub compares it: without accent and case. */
function plain(text: string): string {
  return text.normalize('NFD').replaceAll(/\p{M}/gu, '').toLowerCase()
}

/** What the Hub answers to a read of the list: its Projeto, place and title text narrowing it, a page at a time; a text the contract refuses (empty after trimming, or over its length) gets `null`, which the screen's Hub refuses as the contract does. */
export function listedFor(
  held: { conversations: { conversation: AssistantConversation }[]; pageSize: number },
  params: URLSearchParams,
) {
  const project = params.get('projectId')
  const place = params.get('place')
  const text = listAssistantConversations.input.query.shape.q.safeParse(
    params.get('q') ?? undefined,
  )
  if (!text.success) return null
  const q = text.data ?? null
  const from = Number(params.get('page') ?? 0)
  const all = held.conversations
    .map(({ conversation }) => conversation)
    .filter((one) => project === null || one.projectId === project)
    .filter((one) => place !== 'HOME' || one.projectId === null)
    .filter((one) => place !== 'AUTOMATIONS' || one.automation !== null)
    .filter((one) => q === null || plain(one.title ?? '').includes(plain(q)))
    .map(({ id, title, updatedAt, projectId, automation }) => ({
      ...{ id, title, updatedAt, automation },
      project: projectId === null ? null : { id: projectId, name: PEDIDOS.name },
    }))
  const more = from + held.pageSize < all.length
  return {
    conversations: all.slice(from, from + held.pageSize),
    next: more ? { kind: 'MORE', page: String(from + held.pageSize) } : { kind: 'END' },
  }
}
