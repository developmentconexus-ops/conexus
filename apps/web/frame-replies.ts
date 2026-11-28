import type { Replies } from './layout-harness.ts'
import { COMPANY } from './src/platform/fixtures.ts'
import { OWNER, projectsPage, startsOn } from './sweep-replies.ts'

export const NOW = '2026-10-19T12:00:00.000Z'

/** The owner's Início: the Projetos block and the preparation card read these. */
export function owner(): Replies {
  return {
    ...OWNER,
    ...projectsPage(COMPANY.id),
    ...startsOn(COMPANY.id),
  }
}
