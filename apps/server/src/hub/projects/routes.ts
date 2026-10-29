import {
  changeAppAccess,
  createProject,
  deleteProject,
  getProject,
  listAppAccess,
  listCompanyAppAccess,
  listMyApps,
  listProjects,
  revokeAllAppAccess,
  revokeAppAccess,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { FailureLog } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import type { AccessDeps } from './app-access.ts'
import {
  changeAccess,
  readCompanyAccess,
  readMyApps,
  readProjectAccess,
  revokeAccess,
} from './app-access.ts'
import type { ProjectStore } from './projects.ts'

/** Who uses the company's apps (step 18): a change names who acted and on whom, by ids (S41). */
function registerAccessRoutes(app: FastifyInstance, deps: AccessDeps): void {
  // One Projeto's app or all of them: one line per app taken.
  async function revoked(input: Parameters<typeof revokeAccess>[1], log: FailureLog) {
    const { companyId, personId } = input
    for (const projectId of await revokeAccess(deps, input))
      log.info({ companyId, personId, projectId, by: input.person.id }, 'APP_ACCESS_REVOKED')
    return answer(undefined)
  }
  serve(app, listAppAccess, async ({ person, params }) =>
    answer(await readProjectAccess(deps, { person, ...params })),
  )
  serve(app, changeAppAccess, async ({ person, params, body, log }) => {
    const changed = await changeAccess(deps, { person, ...params, role: body.role })
    log.info({ ...params, by: person.id, role: body.role }, 'APP_ACCESS_CHANGED')
    return answer({ person: changed })
  })
  serve(app, revokeAppAccess, ({ person, params, log }) => revoked({ person, ...params }, log))
  serve(app, listCompanyAppAccess, async ({ person, params, query }) =>
    answer(await readCompanyAccess(deps, { person, ...params }, query.page)),
  )
  serve(app, revokeAllAppAccess, ({ person, params, log }) => revoked({ person, ...params }, log))
  serve(app, listMyApps, async ({ person }) => answer({ apps: await readMyApps(deps, person) }))
}

export function registerProjectRoutes(
  app: FastifyInstance,
  projects: ProjectStore,
  access: AccessDeps,
): void {
  registerAccessRoutes(app, access)
  serve(app, listProjects, async ({ person, params, query }) =>
    answer(await projects.list({ person, ...params, page: query.page })),
  )

  serve(app, getProject, async ({ person, params }) =>
    answer(await projects.get({ person, ...params })),
  )

  serve(app, createProject, async ({ person, params, body, attemptKey, log }) => {
    const made = await projects.create({ person, ...params, name: body.name, attemptKey })
    if (made.databaseCreated)
      log.info({ by: person.id, companyId: params.companyId }, 'COMPANY_DATABASE_CREATED')
    if (made.created) {
      const fields = { by: person.id, companyId: params.companyId, projectId: made.project.id }
      log.info(fields, 'PROJECT_CREATED')
    }
    return answer({ project: made.project })
  })

  serve(app, deleteProject, async ({ person, params, body, log }) => {
    await projects.remove({ person, ...params, name: body.name })
    log.info(
      { by: person.id, companyId: params.companyId, projectId: params.projectId },
      'PROJECT_DELETED',
    )
    return answer(undefined)
  })
}
