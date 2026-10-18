import { z } from 'zod'
import { CompanyId, LIBRARY_ID, Next, Page } from './companies.ts'
import { defineOperation } from './operation.ts'

export const ProjectId = z.string().regex(LIBRARY_ID).brand('ProjectId')
export type ProjectId = z.infer<typeof ProjectId>

/** The longest Project name, in characters, the same as a company's. */
export const PROJECT_NAME_MAX_LENGTH = 100
/** Trimmed and in normal form C, so "Ação" typed two ways is one name. */
export const ProjectName = z
  .string()
  .trim()
  .normalize('NFC')
  .min(1)
  .max(PROJECT_NAME_MAX_LENGTH)
  .brand('ProjectName')
export type ProjectName = z.infer<typeof ProjectName>

export const ProjectSummary = z.object({
  id: ProjectId,
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
})
export type ProjectSummary = z.infer<typeof ProjectSummary>

/**
 * `mayDelete` and `mayManageVersions` are what the viewer's role allows, the Hub's one answer (code C26). `address` is the
 * app's host name, `null` for a Projeto made while the Hub ran step 7's image.
 */
export const Project = ProjectSummary.extend({
  mayDelete: z.boolean(),
  /** Whether the viewer sees the Projeto's settings: sends versions and puts one back (step 9). */
  mayManageVersions: z.boolean(),
  address: z.string().min(1).nullable(),
})
export type Project = z.infer<typeof Project>

const InCompany = z.object({ companyId: CompanyId })
const OfProject = InCompany.extend({ projectId: ProjectId })
const Named = z.object({ name: ProjectName })

export const listProjects = defineOperation({
  id: 'listProjects',
  summary:
    'Lists the Projects of a company the person belongs to, and whether its database exists.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/projects',
  bodyLimit: 1024,
  input: { params: InCompany, query: Page },
  success: {
    status: 200,
    body: z.object({
      projects: z.array(ProjectSummary),
      next: Next,
      databaseReady: z.boolean(),
    }),
  },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const getProject = defineOperation({
  id: 'getProject',
  summary: 'Reads a Project of a company the person belongs to, and whether they may delete it.',
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/projects/{projectId}',
  bodyLimit: 1024,
  input: { params: OfProject },
  success: { status: 200, body: z.object({ project: Project }) },
  failures: ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})

export const createProject = defineOperation({
  id: 'createProject',
  summary:
    'Creates a Project in a company, preparing the company’s database first when it has none.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/projects',
  bodyLimit: 1024,
  input: { params: InCompany, body: Named },
  attemptKey: true,
  success: { status: 201, body: z.object({ project: Project }) },
  failures: [
    'NOT_FOUND',
    'PROJECT_NAME_TAKEN',
    'PROJECT_ADDRESS_TAKEN',
    'PROJECT_NAME_NO_ADDRESS',
    'COMPANY_SETUP_PENDING',
    'COMPANY_DATABASE_PREPARING',
    'IDEMPOTENCY_CONFLICT',
    'COMPANY_DATABASE_UNAVAILABLE',
    'SESSION_REQUIRED',
    'DATABASE_UNAVAILABLE',
  ],
})

export const deleteProject = defineOperation({
  id: 'deleteProject',
  summary:
    'Deletes a Project for an owner or administrator who typed its name; the database stays.',
  access: 'session',
  method: 'DELETE',
  path: '/api/companies/{companyId}/projects/{projectId}',
  bodyLimit: 1024,
  input: { params: OfProject, body: Named },
  success: { status: 204 },
  failures: ['NOT_FOUND', 'PROJECT_NAME_MISMATCH', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'],
})
