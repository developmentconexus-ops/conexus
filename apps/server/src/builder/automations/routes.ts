import type { CompanyId, Person } from '@conexus/hub-api'
import {
  createAutomation,
  deleteAutomation,
  listAutomationRuns,
  listAutomations,
  pauseAutomation,
  resumeAutomation,
  runAutomation,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import type { Owner } from '../assistant/public.ts'
import type { Automations } from './automations.ts'

function ownerOf(input: { person: Person; params: { companyId: CompanyId } }): Owner {
  return { companyId: input.params.companyId, personId: input.person.id }
}

/** The person's automations (step 24.2); the service admits the person on each (`askAssistant`). */
export function registerAutomationRoutes(app: FastifyInstance, automations: Automations): void {
  serve(app, listAutomations, async (input) =>
    answer({ automations: await automations.list(ownerOf(input), input.query.projectId) }),
  )
  serve(app, createAutomation, async (input) =>
    answer({ automation: await automations.create(ownerOf(input), input.body, input.attemptKey) }),
  )
  serve(app, pauseAutomation, async (input) =>
    answer({ automation: await automations.pause(ownerOf(input), input.params.automationId) }),
  )
  serve(app, resumeAutomation, async (input) =>
    answer({ automation: await automations.resume(ownerOf(input), input.params.automationId) }),
  )
  serve(app, runAutomation, async (input) =>
    answer(await automations.runNow(ownerOf(input), input.params.automationId)),
  )
  serve(app, deleteAutomation, async (input) => {
    await automations.remove(ownerOf(input), input.params.automationId)
    return answer(undefined)
  })
  serve(app, listAutomationRuns, async (input) =>
    answer(await automations.runs(ownerOf(input), input.params.automationId, input.query.page)),
  )
}
