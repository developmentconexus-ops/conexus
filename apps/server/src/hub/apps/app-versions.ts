import type { CompanyId, Person, PersonId, PreviewData, ProjectId, RunId } from '@conexus/hub-api'
import { PreviewFailure } from '@conexus/hub-api'
import { databaseFailure } from '../../platform/database.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { setLiveVersion } from './live.ts'
import type { SendDeps } from './send.ts'
import { admitReader, sendVersion } from './send.ts'
import type { VersionFolder } from './versions.ts'
import { listVersions } from './versions.ts'

type OfProject = { person: Person; companyId: CompanyId; projectId: ProjectId }

/** A Builder turn's version, as the end of the turn hands it over (step 14.1). */
export type BuilderVersion = {
  companyId: CompanyId
  projectId: ProjectId
  personId: PersonId
  runId: RunId
  /** The number the turn saved it as, which the conversation and the Versões tab name it by. */
  number: number
  folder: VersionFolder
}

/**
 * Sends a turn's version to the Projeto's app as the person of the turn, the run its attempt key:
 * whether it reached the app, or why not. A Projeto deleted meanwhile, or a person no longer in the
 * company, is `NOT_FOUND`: nothing is told, for there is no app of theirs left to tell of.
 */
async function sendFromBuilder(
  deps: SendDeps,
  input: BuilderVersion,
): Promise<PreviewData | undefined> {
  const { companyId, projectId, personId, number, folder } = input
  try {
    await sendVersion(deps, {
      ...{ companyId, projectId, personId, number, ...folder },
      attemptKey: input.runId,
    })
    return { state: 'ready', number }
  } catch (error) {
    if (error instanceof Failure && error.code === 'NOT_FOUND') return undefined
    const known = PreviewFailure.safeParse(error instanceof Failure ? error.code : undefined)
    if (!known.success) logFailure(deps.log, databaseFailure(error))
    const code = known.success ? known.data : 'APP_VERSION_FAILED'
    deps.log.error({ companyId, projectId, runId: input.runId, code }, 'PREVIEW_SEND_FAILED')
    return { state: 'failed', number, code }
  }
}

/** What the routes reach a Projeto's versions through, each act bound to its dependencies. */
export function createAppVersions(deps: SendDeps) {
  return Object.freeze({
    sendFromBuilder: (input: BuilderVersion) => sendFromBuilder(deps, input),
    setLive: (input: Parameters<typeof setLiveVersion>[1]) => setLiveVersion(deps, input),
    list: (input: OfProject) =>
      deps.database.read(
        { kind: 'COMPANY', companyId: input.companyId, personId: input.person.id },
        async (tx) => {
          await admitReader(deps, tx, input)
          return listVersions(tx, input)
        },
      ),
  })
}
export type AppVersions = ReturnType<typeof createAppVersions>
