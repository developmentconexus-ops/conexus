import { z } from 'zod'
import { CompanyId } from './companies.ts'
import type { FailureCode } from './failures.ts'
import { ATTEMPT_KEY_HEADER, defineOperation } from './operation.ts'
import { WorkflowId } from './workflow-ids.ts'
import { CreateWorkflowBody, PublishBody, SaveDraftBody, WorkflowView } from './workflows.ts'

const InCompany = z.object({ companyId: CompanyId })
const OfWorkflow = InCompany.extend({ workflowId: WorkflowId })
const BASE = '/api/companies/{companyId}/workflows'
const READ_FAILURES = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]
const ONE_FAILURES = [...READ_FAILURES, 'WORKFLOW_NOT_FOUND'] as const
const One = z.object({ workflow: WorkflowView })

export const createWorkflow = defineOperation({
  id: 'createWorkflow',
  summary: `Creates a workflow of the company or of one Projeto from a draft, keyed by ${ATTEMPT_KEY_HEADER}.`,
  access: 'session',
  method: 'POST',
  path: BASE,
  bodyLimit: 65_536,
  input: { params: InCompany, body: CreateWorkflowBody },
  attemptKey: true,
  success: { status: 201, body: One },
  failures: [...READ_FAILURES, 'REQUEST_MALFORMED', 'IDEMPOTENCY_CONFLICT', 'NOT_IN_ROLE'],
})

export const getWorkflow = defineOperation({
  id: 'getWorkflow',
  summary: 'Reads one workflow: its draft, its problems and its published version.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/{workflowId}`,
  bodyLimit: 1024,
  input: { params: OfWorkflow },
  success: { status: 200, body: One },
  failures: ONE_FAILURES,
})

export const saveWorkflowDraft = defineOperation({
  id: 'saveWorkflowDraft',
  summary:
    'Saves a workflow’s draft at the revision read; a draft with problems is saved with its list.',
  access: 'session',
  method: 'PUT',
  path: `${BASE}/{workflowId}/draft`,
  bodyLimit: 65_536,
  input: { params: OfWorkflow, body: SaveDraftBody },
  success: { status: 200, body: One },
  failures: [...ONE_FAILURES, 'REQUEST_MALFORMED', 'WORKFLOW_DRAFT_STALE', 'NOT_IN_ROLE'],
})

export const publishWorkflow = defineOperation({
  id: 'publishWorkflow',
  summary:
    'Freezes the draft of the revision read as the workflow’s next version and makes it active.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/{workflowId}/publish`,
  bodyLimit: 1024,
  input: { params: OfWorkflow, body: PublishBody },
  success: { status: 200, body: One },
  failures: [
    ...ONE_FAILURES,
    'WORKFLOW_HAS_PROBLEMS',
    'WORKFLOW_DRAFT_STALE',
    'NOT_IN_ROLE',
    'WORKFLOW_PUBLISH_REFUSED',
    'AUTOMATION_LIMIT',
    'HUB_UPDATING',
  ],
})

export const deleteWorkflow = defineOperation({
  id: 'deleteWorkflow',
  summary: 'Deletes a workflow, its versions and its definitions in Mastra.',
  access: 'session',
  method: 'DELETE',
  path: `${BASE}/{workflowId}`,
  bodyLimit: 1024,
  input: { params: OfWorkflow },
  success: { status: 204 },
  failures: [...ONE_FAILURES, 'HUB_UPDATING'],
})
