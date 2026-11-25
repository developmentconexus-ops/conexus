import type { CheckReport } from '@conexus/app/check'
import type { AppSessionToken } from '@conexus/hub-api'
import type { ConferPlatformFailed, VersionFolder } from '../../../harness/machine/public.ts'
import type { Result } from '../../../platform/result.ts'
import type { BuilderCheck, Driven, RunsDeps } from './context.ts'

const PLATFORM_FAILED = { ok: false, error: 'CONFER_PLATFORM_FAILED' } as const

/** The version the passing check left, read while the run still holds the machine. */
export async function packed(deps: RunsDeps, mine: Driven): Promise<Result<VersionFolder, string>> {
  const { companyId, projectId, conversationId, runId } = mine
  const fields = { companyId, projectId, conversationId, runId }
  try {
    const found = await deps.machines.pack({ conversationId })
    if (!found.ok) deps.log.error({ ...fields, reason: found.error }, 'PREVIEW_PACK_REFUSED')
    return found
  } catch (error) {
    // The machine died on the way: there is no version to send.
    deps.log.error({ ...fields, reason: 'LOST', error: String(error) }, 'PREVIEW_PACK_REFUSED')
    return { ok: false, error: 'LOST' }
  }
}

async function ended(deps: RunsDeps, mine: Driven, session: AppSessionToken): Promise<void> {
  const { companyId, projectId, conversationId } = mine
  // The row expires on its own in minutes; a failed delete is told and the check goes on.
  await deps.confer
    .end({ session })
    .catch((error: unknown) =>
      deps.log.error(
        { companyId, projectId, conversationId, error: String(error) },
        'APP_CONFERENCE_END_FAILED',
      ),
    )
}

/**
 * The browser's check of a machine check that passed: the version opened as the Projeto's app, the
 * entry screen seen from the machine, the session ended however the browser went. A version that
 * cannot be packed or opened for lack of the platform is no verdict on the app.
 */
export async function conferred(
  deps: RunsDeps,
  mine: Driven,
  machine: CheckReport,
): Promise<Result<BuilderCheck, ConferPlatformFailed>> {
  const folder = await packed(deps, mine)
  if (!folder.ok) return PLATFORM_FAILED
  const { companyId, projectId, personId, conversationId } = mine
  const opened = await deps.confer.open({ companyId, projectId, personId, folder: folder.value })
  if (!opened.ok) return opened
  const conference = opened.value
  switch (conference.kind) {
    case 'NO_ADDRESS':
      return { ok: true, value: { kind: 'NO_ADDRESS', machine } }
    case 'NOT_STARTING':
    case 'MIGRATION_REFUSED':
      return { ok: true, value: { kind: 'CONFERENCE_REFUSED', machine, conference } }
    case 'OPENED': {
      const { url, session } = conference
      try {
        const browser = await deps.machines.confer({ conversationId, at: { url, session } })
        if (!browser.ok) return browser
        return { ok: true, value: { kind: 'SEEN', machine, browser: browser.value } }
      } finally {
        await ended(deps, mine, session)
      }
    }
    default:
      return conference satisfies never
  }
}
