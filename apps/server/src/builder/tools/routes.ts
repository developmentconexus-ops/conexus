import type { CompanyId, Person, ProjectId } from '@conexus/hub-api'
import { createTool, createToolVersion, deleteTool, getTool, listTools } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import type { InProject } from './check.ts'
import type { Tools } from './tools.ts'

/** The session's person in the route's Projeto (security S8: never an id from a body). */
export function inProjectOf(input: {
  person: Person
  params: { companyId: CompanyId; projectId: ProjectId }
}): InProject {
  const { companyId, projectId } = input.params
  return { companyId, projectId, personId: input.person.id }
}

/** The tool library's routes (step 24.3, U1); the service admits the person on each. */
export function registerToolRoutes(app: FastifyInstance, tools: Tools): void {
  serve(app, listTools, async (input) => answer(await tools.list(inProjectOf(input))))
  serve(app, createTool, async (input) =>
    answer({ tool: await tools.save(inProjectOf(input), input.body, input.attemptKey) }),
  )
  serve(app, getTool, async (input) =>
    answer({ tool: await tools.get(inProjectOf(input), input.params.toolId) }),
  )
  serve(app, createToolVersion, async (input) => {
    const { toolId } = input.params
    return answer({
      tool: await tools.addVersion(inProjectOf(input), toolId, input.body, input.attemptKey),
    })
  })
  serve(app, deleteTool, async (input) => {
    await tools.remove(inProjectOf(input), input.params.toolId)
    return answer(undefined)
  })
}
