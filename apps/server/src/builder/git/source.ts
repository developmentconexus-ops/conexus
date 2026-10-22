import type { CompanyId, Person, ProjectId } from '@conexus/hub-api'
import { readProjectFile, readProjectSource, SOURCE_FILE_MAX_BYTES } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { ProjectPorts } from '../../hub/projects/public.ts'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import { Sha } from './context.ts'
import type { Repository } from './repository.ts'

type Ids = { companyId: CompanyId; projectId: ProjectId }
type Deps = {
  database: Database
  identity: IdentityPorts
  projects: Pick<ProjectPorts, 'liveProjectOf'>
  repository: (ids: Ids) => Repository
}

/** The person is a member of the company and the Projeto is live; any other case is the same 404 (S10). */
async function admit(deps: Deps, person: Person, ids: Ids): Promise<void> {
  const scope = { kind: 'COMPANY', companyId: ids.companyId, personId: person.id } as const
  await deps.database.read(scope, async (tx) => {
    await deps.identity.admitMember({
      tx,
      personId: person.id,
      companyId: ids.companyId,
      action: 'readProjectSource',
    })
    if ((await deps.projects.liveProjectOf(tx, ids)) === undefined) {
      throw new Failure('NOT_FOUND', { details: { reason: 'PROJECT' } })
    }
  })
}

/**
 * The files of the Projeto's saved versions, for the Código tab: read from the server's own Git, a
 * version at a time, only what `main` holds (code C44, C48).
 */
export function registerSourceRoutes(app: FastifyInstance, deps: Deps): void {
  serve(app, readProjectSource, async ({ person, params }) => {
    await admit(deps, person, params)
    const repository = deps.repository(params)
    const commit = await repository.head()
    // No repository, or only the starter commit: no version was saved, and a read makes none.
    const version = commit === null ? 0 : await repository.version()
    if (commit === null || version === 0) {
      return answer({ version: 0, commit: null, savedAt: null, files: [] })
    }
    const files = (await repository.tree(commit)) ?? []
    return answer({
      version,
      commit,
      savedAt: await repository.savedAt(commit),
      files: files.toSorted((a, b) => a.path.localeCompare(b.path)),
    })
  })

  serve(app, readProjectFile, async ({ person, params, query }) => {
    await admit(deps, person, params)
    const read = await deps.repository(params).file({
      sha: Sha.parse(query.commit),
      path: query.path,
      maxBytes: SOURCE_FILE_MAX_BYTES,
    })
    if (read.kind === 'not-found') throw new Failure('SOURCE_FILE_NOT_FOUND')
    if (read.kind === 'too-large' || read.kind === 'not-text')
      throw new Failure('SOURCE_FILE_NOT_TEXT')
    return answer({ text: read.text })
  })
}
