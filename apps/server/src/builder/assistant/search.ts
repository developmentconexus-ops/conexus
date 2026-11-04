import type { ProjectId } from '@conexus/hub-api'
import type { StorageThreadType } from '@mastra/core/memory'
import { resourceOf } from '../controller-kit/public.ts'
import type { Owner } from './context.ts'
import { SESSION_MARK } from './context.ts'
import type { assistantMemory } from './memory.ts'

/** A page of the person's conversations holds 30 (code C44). */
export const PER_PAGE = 30

/** Mastra's `listThreads` filters by owner and marks only: a title is searched here, on what it returns. */
export type ListFilter = { q?: string | undefined; place?: 'HOME' | 'AUTOMATIONS' | undefined }

/** A title or a search text as compared: composed, without accent and without case. */
function comparable(text: string): string {
  return text.normalize('NFD').replaceAll(/\p{M}/gu, '').normalize('NFC').toLocaleLowerCase('pt-BR')
}

function inPlace(thread: StorageThreadType, place: ListFilter['place']): boolean {
  if (place === 'HOME') return thread.metadata?.[SESSION_MARK.project] === undefined
  if (place === 'AUTOMATIONS') return thread.metadata?.[SESSION_MARK.automation] !== undefined
  return true
}

/** Of the threads, those in the place whose title holds the text, in the order given. */
export function matching(threads: readonly StorageThreadType[], filter: ListFilter) {
  const wanted = filter.q === undefined ? undefined : comparable(filter.q)
  return threads.filter(
    (thread) =>
      inPlace(thread, filter.place) &&
      (wanted === undefined || comparable(thread.title ?? '').includes(wanted)),
  )
}

/**
 * One page of the person's threads, newest first. With a text or a place, Mastra's own page cannot
 * say which threads match, so all the person's threads are read and the matching ones are paged
 * here, 30 at a time under the same token.
 */
export async function listedPage(
  memory: ReturnType<typeof assistantMemory>,
  asked: ListFilter & { owner: Owner; projectId: ProjectId | undefined; page: number },
) {
  const { page, q, place, owner, projectId } = asked
  const base = {
    resourceId: resourceOf('assistant', owner),
    ...(projectId === undefined ? {} : { metadata: { [SESSION_MARK.project]: projectId } }),
  }
  const orderBy = { field: 'updatedAt', direction: 'DESC' } as const
  if (q === undefined && place === undefined) {
    return memory.listThreads({ filter: base, page, perPage: PER_PAGE, orderBy })
  }
  const all = await memory.listThreads({ filter: base, perPage: false, orderBy })
  const found = matching(all.threads, { q, place })
  const from = page * PER_PAGE
  return { threads: found.slice(from, from + PER_PAGE), hasMore: found.length > from + PER_PAGE }
}
