import type { CompanyId, Person, ProjectId } from '@conexus/hub-api'
import { setLiveVersion } from './live.ts'
import type { SendDeps } from './send.ts'
import { admitReader, sendVersion } from './send.ts'
import { listVersions } from './versions.ts'

type OfProject = { person: Person; companyId: CompanyId; projectId: ProjectId }

/** What the routes reach a Projeto's versions through, each act bound to its dependencies. */
export function createAppVersions(deps: SendDeps) {
  return Object.freeze({
    send: (input: Parameters<typeof sendVersion>[1]) => sendVersion(deps, input),
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
