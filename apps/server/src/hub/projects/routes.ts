import { createProject, deleteProject, getProject, listProjects } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import type { ProjectStore } from './projects.ts'

export function registerProjectRoutes(app: FastifyInstance, projects: ProjectStore): void {
  serve(app, listProjects, async ({ person, params, query }) =>
    answer(await projects.list({ person, ...params, page: query.page })),
  )

  serve(app, getProject, async ({ person, params }) =>
    answer(await projects.get({ person, ...params })),
  )

  serve(app, createProject, async ({ person, params, body, attemptKey, log }) => {
    const made = await projects.create({ person, ...params, name: body.name, attemptKey })
    if (made.databaseCreated) log.info({ companyId: params.companyId }, 'COMPANY_DATABASE_CREATED')
    if (made.created) {
      const fields = { companyId: params.companyId, projectId: made.project.id }
      log.info(fields, 'PROJECT_CREATED')
    }
    return answer({ project: made.project })
  })

  serve(app, deleteProject, async ({ person, params, body, log }) => {
    await projects.remove({ person, ...params, name: body.name })
    log.info({ companyId: params.companyId, projectId: params.projectId }, 'PROJECT_DELETED')
    return answer(undefined)
  })
}
