import { listProjects } from '@conexus/hub-api'
import type { Locator, Page } from 'playwright-core'
import type { Replies, Reply } from './layout-harness.ts'
import { ok } from './layout-harness.ts'
import { companies, PROJECT_ID, PROJECT_NAME } from './sweep-replies.ts'

const COMPANY_ID = '0'.repeat(32)
export const PROJECTS = `/api/companies/${COMPANY_ID}/projects`
export const SECOND = 'segunda'
const NOW = '2026-11-02T12:00:00.000Z'

export function project(n: number) {
  const number = String(n).padStart(2, '0')
  return {
    id: `p${number}`.padEnd(32, 'x'),
    name: `Projeto ${number}`,
    createdAt: NOW,
    appVersion: null,
    publishedVersion: null,
  }
}

export const SIXTY = Array.from({ length: 60 }, (_, at) => project(at + 1))

export function projectsReply(projects: ReturnType<typeof project>[], next: 'END' | 'MORE'): Reply {
  return ok(listProjects, {
    projects,
    next: next === 'MORE' ? { kind: 'MORE', page: SECOND } : { kind: 'END' },
    databaseReady: true,
  })
}

export function asked(query: Record<string, string>): string {
  return `GET ${PROJECTS}?${new URLSearchParams(query)}`
}

export function sixty(second: Reply = projectsReply(SIXTY.slice(50), 'END')): Replies {
  return {
    [`GET ${PROJECTS}`]: projectsReply(SIXTY.slice(0, 50), 'MORE'),
    [asked({ page: SECOND })]: second,
  }
}

export type Place = {
  name: string
  path: string
  /** The name of the trigger and of its list. */
  label: string
  /** A fixed item of the place, chosen in the browser, that stays when the Hub fails. */
  fixed: string
  /** On a phone the trigger sits in the navigation drawer, opened first. */
  drawer: boolean
  /** An option to choose and the address it leads to; none when the choice stays in the trigger. */
  pick: { option: string; address: RegExp | undefined }
  replies: (projects: Replies) => Replies
}

const COMPANY = companies([{ name: 'Empresa Teste', role: 'owner' }], false)

export const PLACES: readonly Place[] = [
  {
    name: 'a barra do Projeto',
    path: `/companies/${COMPANY_ID}/projects/${PROJECT_ID}`,
    label: `Trocar de Projeto. Agora: ${PROJECT_NAME}`,
    fixed: 'Todos os projetos',
    drawer: true,
    pick: { option: 'Todos os projetos', address: /\/projects$/ },
    replies: (projects) => ({ ...COMPANY, ...projects }),
  },
]

export async function triggerOf(page: Page, place: Place): Promise<Locator> {
  const trigger = page.getByRole('combobox', { name: place.label, exact: true })
  if (place.drawer && (page.viewportSize()?.width ?? 0) < 768)
    await page.getByRole('button', { name: 'Abrir navegação' }).click()
  return trigger
}

export function popupOf(page: Page): Locator {
  return page.locator('[data-slot=combobox-content], [data-slot=select-content]')
}
