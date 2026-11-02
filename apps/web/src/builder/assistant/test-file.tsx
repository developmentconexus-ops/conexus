import type { ShownFile } from '@conexus/hub-api'
import { ASSISTANT_TOOL } from '@conexus/hub-api'
import type { assistantScreens } from './test-hub.tsx'
import { ASKED, assistantConversation, COMPANY_ROOT, toolSaid } from './test-hub.tsx'

/** The address of the conversation the file tests open. */
export const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`

/** The conversation where the Assistant showed `shown` at `path`, on the screens `at` opens. */
export function showingOn(at: ReturnType<typeof assistantScreens>['at']) {
  return (path: string, shown: ShownFile, answers = {}) =>
    at(OPEN, {
      conversations: [
        assistantConversation({
          messages: [toolSaid(ASSISTANT_TOOL.showFile, { path }, shown)],
        }),
      ],
      answers,
    })
}

/**
 * What the browser is asked to save: the page has no download manager here, only the anchor it
 * clicks. `attached` says whether the anchor was in the page at the click, `revoked` which blob
 * addresses were let go.
 */
export function savedWith(spyOnClick: (impl: (this: HTMLAnchorElement) => void) => void) {
  const files: { href: string; download: string }[] = []
  const attached: boolean[] = []
  const revoked: string[] = []
  Object.assign(URL, {
    createObjectURL: () => 'blob:arquivo',
    revokeObjectURL: (href: string) => revoked.push(href),
  })
  spyOnClick(function save(this: HTMLAnchorElement) {
    files.push({ href: this.href, download: this.download })
    attached.push(this.isConnected)
  })
  return { files, attached, revoked }
}

export const CHART: ShownFile = {
  kind: 'FILE',
  path: 'grafico.svg',
  name: 'grafico.svg',
  media: 'image/svg+xml',
  bytes: 200,
}

export const PNG: Extract<ShownFile, { kind: 'FILE' }> = {
  kind: 'FILE',
  path: 'grafico.png',
  name: 'grafico.png',
  media: 'image/png',
  bytes: 2048,
}
