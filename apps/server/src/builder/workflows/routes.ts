import {
  createWorkflow,
  deleteWorkflow,
  getWorkflow,
  publishWorkflow,
  saveWorkflowDraft,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import * as publishing from './publish.ts'
import type { WorkflowsDeps } from './workflows.ts'
import * as workflows from './workflows.ts'

/** The company's workflows (step 24.6, U1); each service call admits the person (`manageAutomations`). */
export function registerWorkflowRoutes(app: FastifyInstance, deps: WorkflowsDeps): void {
  function who(input: {
    person: { id: workflows.Acting['personId'] }
    params: { companyId: workflows.Acting['companyId'] }
  }) {
    return { companyId: input.params.companyId, personId: input.person.id }
  }
  serve(app, createWorkflow, async (input) =>
    answer({
      workflow: await workflows.createWorkflow(deps, who(input), input.body, input.attemptKey),
    }),
  )
  serve(app, getWorkflow, async (input) =>
    answer({ workflow: await workflows.getWorkflow(deps, who(input), input.params.workflowId) }),
  )
  serve(app, saveWorkflowDraft, async (input) =>
    answer({
      workflow: await workflows.saveDraft(deps, who(input), input.params.workflowId, input.body),
    }),
  )
  serve(app, publishWorkflow, async (input) =>
    answer({
      workflow: await publishing.publishWorkflow(
        deps,
        who(input),
        input.params.workflowId,
        input.body,
      ),
    }),
  )
  serve(app, deleteWorkflow, async (input) => {
    await publishing.deleteWorkflow(deps, who(input), input.params.workflowId)
    return answer(undefined)
  })
}
