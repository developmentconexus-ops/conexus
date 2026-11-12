import { z } from 'zod'
import { InCompany } from './companies.ts'
import type { FailureCode } from './failures.ts'
import { defineOperation } from './operation.ts'

/** The longest the company's instructions are: half a page, under the pinned pages' budget. */
export const COMPANY_INSTRUCTIONS_MAX = 2000

/**
 * A page or a note of the company's memory: the id Mastra's `Knowledge` gives it (a ULID), or the
 * attempt key of the save from a proposal's card that created it (code C37).
 */
const KnowledgeId = z.union([z.string().regex(/^[0-9A-HJKMNP-TV-Z]{26}$/), z.uuid()])
export const CompanyMemoryPageId = KnowledgeId.brand<'CompanyMemoryPageId'>()
export type CompanyMemoryPageId = z.infer<typeof CompanyMemoryPageId>
export const CompanyMemoryNoteId = KnowledgeId.brand<'CompanyMemoryNoteId'>()
export type CompanyMemoryNoteId = z.infer<typeof CompanyMemoryNoteId>

/** Who wrote last: the person's name, or `null` when the Assistant did. */
const Author = z.string().nullable()

export const CompanyMemoryNote = z.object({
  id: CompanyMemoryNoteId,
  body: z.string(),
  updatedAt: z.iso.datetime(),
  author: Author,
})
export type CompanyMemoryNote = z.infer<typeof CompanyMemoryNote>

const Entry = z.object({
  pageId: CompanyMemoryPageId,
  name: z.string(),
  updatedAt: z.iso.datetime(),
  author: Author,
})

export const CompanyMemoryPage = Entry.extend({
  body: z.string(),
  /** What a change compares with, so a change made meanwhile is refused (code C38). */
  version: z.number().int().min(1),
  notes: z.array(CompanyMemoryNote),
})
export type CompanyMemoryPage = z.infer<typeof CompanyMemoryPage>

/** A page's name and a note's text, as the screen and a proposal write them. */
const PageName = z.string().trim().min(1).max(200)
const NoteText = z.string().trim().min(1).max(1000)

/**
 * What `propose_company_memory` answers, drawn as a card in the conversation: a new page, or a note
 * on a page the model read. Nothing is saved until a person who may tap **Salvar** (B1).
 */
export const ProposedCompanyMemory = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('PAGE'), name: PageName, body: z.string().min(1) }),
  z.object({
    kind: z.literal('NOTE'),
    pageId: CompanyMemoryPageId,
    pageName: z.string(),
    body: NoteText,
  }),
])
export type ProposedCompanyMemory = z.infer<typeof ProposedCompanyMemory>

const BASE = '/api/companies/{companyId}/assistant/company-memory'
const OfPage = InCompany.extend({ pageId: CompanyMemoryPageId })
const OfNote = InCompany.extend({ noteId: CompanyMemoryNoteId })

const READS = [
  'NOT_FOUND',
  'SESSION_REQUIRED',
  'DATABASE_UNAVAILABLE',
] as const satisfies readonly FailureCode[]
const WRITES = [
  ...READS,
  'NOT_IN_ROLE',
  'REQUEST_MALFORMED',
  'COMPANY_MEMORY_CHANGED',
] as const satisfies readonly FailureCode[]

export const listCompanyMemory = defineOperation({
  id: 'listCompanyMemory',
  summary:
    'Reads what the Assistant follows in every conversation of the company: its instructions and its pages, with whether the person may change them.',
  access: 'session',
  method: 'GET',
  path: BASE,
  bodyLimit: 1024,
  input: { params: InCompany },
  success: {
    status: 200,
    body: z.object({
      instructions: CompanyMemoryPage,
      pages: z.array(Entry),
      mayManage: z.boolean(),
    }),
  },
  failures: READS,
})

export const readCompanyMemoryPage = defineOperation({
  id: 'readCompanyMemoryPage',
  summary: 'Reads one page of the company’s memory with its notes.',
  access: 'session',
  method: 'GET',
  path: `${BASE}/pages/{pageId}`,
  bodyLimit: 1024,
  input: { params: OfPage },
  success: { status: 200, body: z.object({ page: CompanyMemoryPage }) },
  failures: READS,
})

export const writeCompanyMemoryPage = defineOperation({
  id: 'writeCompanyMemoryPage',
  summary:
    'Replaces the name and the text of a page of the company’s memory, refused when it changed since the version read.',
  access: 'session',
  method: 'PUT',
  path: `${BASE}/pages/{pageId}`,
  bodyLimit: 128 * 1024,
  input: {
    params: OfPage,
    body: z.object({
      name: PageName,
      body: z.string(),
      version: z.number().int().min(1),
    }),
  },
  success: { status: 200, body: z.object({ page: CompanyMemoryPage }) },
  failures: WRITES,
})

export const removeCompanyMemoryPage = defineOperation({
  id: 'removeCompanyMemoryPage',
  summary:
    'Removes a page of the company’s memory, refused when it changed since the version read; the instructions stay.',
  access: 'session',
  method: 'DELETE',
  path: `${BASE}/pages/{pageId}`,
  bodyLimit: 1024,
  input: { params: OfPage, query: z.object({ version: z.coerce.number().int().min(1) }) },
  success: { status: 204 },
  failures: WRITES,
})

export const writeCompanyMemoryNote = defineOperation({
  id: 'writeCompanyMemoryNote',
  summary: 'Replaces the text of a note of the company’s memory; the note gets a new id.',
  access: 'session',
  method: 'PUT',
  path: `${BASE}/notes/{noteId}`,
  bodyLimit: 16 * 1024,
  input: { params: OfNote, body: z.object({ body: NoteText }) },
  success: { status: 200, body: z.object({ note: CompanyMemoryNote }) },
  failures: WRITES,
})

export const removeCompanyMemoryNote = defineOperation({
  id: 'removeCompanyMemoryNote',
  summary: 'Removes a note of the company’s memory.',
  access: 'session',
  method: 'DELETE',
  path: `${BASE}/notes/{noteId}`,
  bodyLimit: 1024,
  input: { params: OfNote },
  success: { status: 204 },
  failures: WRITES,
})

export const createCompanyMemoryPage = defineOperation({
  id: 'createCompanyMemoryPage',
  summary:
    'Saves a new page in the company’s memory, as a proposal’s card asks; the attempt key names it, so a repeated save answers the same page.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/pages`,
  bodyLimit: 128 * 1024,
  attemptKey: true,
  input: { params: InCompany, body: z.object({ name: PageName, body: z.string().min(1) }) },
  success: { status: 201, body: z.object({ page: CompanyMemoryPage }) },
  failures: WRITES,
})

export const addCompanyMemoryNote = defineOperation({
  id: 'addCompanyMemoryNote',
  summary:
    'Adds a note to a page of the company’s memory, as a proposal’s card asks; the attempt key names it, so a repeated save answers the same note.',
  access: 'session',
  method: 'POST',
  path: `${BASE}/pages/{pageId}/notes`,
  bodyLimit: 16 * 1024,
  attemptKey: true,
  input: { params: OfPage, body: z.object({ body: NoteText }) },
  success: { status: 201, body: z.object({ note: CompanyMemoryNote }) },
  failures: WRITES,
})
