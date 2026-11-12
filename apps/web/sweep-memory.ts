import { getProfileMemory, listCompanyMemory } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'

/**
 * What Minha conta and Memória da empresa read: the person's working memory, empty, and the
 * company's instructions with no page, which only an owner or an administrator may change.
 */
export function memoryPages(id: string, mayManage: boolean): Replies {
  return {
    [`GET /api/companies/${id}/assistant/profile-memory`]: ok(getProfileMemory, { text: null }),
    [`GET /api/companies/${id}/assistant/company-memory`]: ok(listCompanyMemory, {
      instructions: {
        ...{ name: 'Instruções da empresa', body: '' },
        ...{ updatedAt: '2026-11-11T15:00:00.000Z', author: null },
      },
      pages: [],
      mayManage,
    }),
  }
}
