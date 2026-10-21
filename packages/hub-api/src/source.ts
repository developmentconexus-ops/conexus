import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { defineOperation } from './operation.ts'
import { ProjectId } from './projects.ts'

/** The most files a Projeto's version lists, and the largest file shown, in bytes (code C44, C48). */
export const SOURCE_MAX_FILES = 2000
export const SOURCE_FILE_MAX_BYTES = 1024 * 1024

const InProject = z.object({ companyId: CompanyId, projectId: ProjectId })
const Commit = z.string().regex(/^[0-9a-f]{40}$/)
const BASE = '/api/companies/{companyId}/projects/{projectId}/source'
const READ_FAILURES = ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'] as const

export const SourceFile = z.object({ path: z.string().min(1), bytes: z.int().nonnegative() })

/** The Projeto's current version: its number (0 before the first), its commit and time (null before the first), its files. */
export const ProjectSource = z.object({
  version: z.int().nonnegative(),
  commit: Commit.nullable(),
  savedAt: z.iso.datetime().nullable(),
  files: z.array(SourceFile).max(SOURCE_MAX_FILES),
})
export type ProjectSource = z.infer<typeof ProjectSource>

export const readProjectSource = defineOperation({
  id: 'readProjectSource',
  summary: 'Reads the files of the Projeto’s current version: their paths and sizes.',
  access: 'session',
  method: 'GET',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InProject },
  success: { status: 200, body: ProjectSource },
  failures: READ_FAILURES,
})

export const readProjectFile = defineOperation({
  id: 'readProjectFile',
  summary: 'Reads one file of a saved version of the Projeto as text, up to 1 MiB.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/file`,
  bodyLimit: 1024,
  input: {
    params: InProject,
    query: z.object({ commit: Commit, path: z.string().min(1).max(512) }),
  },
  success: { status: 200, body: z.object({ text: z.string() }) },
  failures: [
    ...READ_FAILURES,
    'SOURCE_FILE_NOT_FOUND',
    'SOURCE_FILE_NOT_TEXT',
    'SOURCE_FILE_TOO_LARGE',
  ],
})
