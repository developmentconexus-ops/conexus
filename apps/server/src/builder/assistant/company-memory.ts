import type { CompanyId } from '@conexus/hub-api'
import {
  COMPANY_INSTRUCTIONS_MAX,
  CompanyMemoryNoteId,
  CompanyMemoryPageId,
  PersonId,
} from '@conexus/hub-api'
import type {
  KnowledgeNote,
  KnowledgePage,
  KnowledgeProvenance,
  KnowledgeScopeDeclarations,
} from '@mastra/core/knowledge'
import {
  Knowledge,
  KnowledgeConflictError,
  listKnowledgeTreeChildren,
  readKnowledgePage,
} from '@mastra/core/knowledge'
import type { RequestContext } from '@mastra/core/request-context'
import type { PostgresStore } from '@mastra/pg'
import { Failure } from '../../platform/failure.ts'
import type { ScopeOf } from './context.ts'

/**
 * Its tools, by the ids Mastra gives them: reading only (B1, decision 0064). `tools: { write: false }`
 * leaves out `knowledge_page` and `knowledge_note` (`@mastra/core@1.82.0` `dist/knowledge/index.js:1231-1247`);
 * `knowledge_pin` comes with any pinned context (`:1236`), and this closed set leaves it out.
 */
export const COMPANY_MEMORY_TOOLS = [
  'knowledge_search',
  'knowledge_read',
  'knowledge_list',
] as const

/** The page every company holds from its first conversation, pinned into each of them. */
const INSTRUCTIONS = { key: 'instrucoes', name: 'Instruções da empresa' } as const

/** The most pages the screen lists under the company: its memory is a handful of pages. */
const LISTED = 100

/**
 * Who reads what (Mastra Code `sdk/src/index.ts:865-888`): a run reads its own thread and resource
 * and its company's scope, and writes none (B1): the model proposes, and a person who may saves from
 * the card. Mastra's own `knowledgeMemoryScopes` makes every run an editor of its tenant.
 */
const SCOPES = {
  'thread:$threadId': { access: [{ principal: 'self', role: 'viewer' }] },
  'resource:$resourceId': { access: [{ principal: 'self', role: 'viewer' }] },
  'org:$orgId': {
    access: [{ principal: 'self', role: 'viewer' }],
    pages: [INSTRUCTIONS],
    pinnedContext: [`org:$orgId#${INSTRUCTIONS.key}`],
  },
} satisfies KnowledgeScopeDeclarations

/** The person a write records, as the Hub writes it; the Assistant's own writes name no person. */
const PERSON = 'person:'

function writerOf(provenance: KnowledgeProvenance) {
  const read = provenance.author.startsWith(PERSON)
    ? PersonId.safeParse(provenance.author.slice(PERSON.length))
    : undefined
  return read?.success ? read.data : null
}

function entryOf(page: KnowledgePage) {
  return {
    pageId: CompanyMemoryPageId.parse(page.id),
    name: page.name,
    updatedAt: page.updatedAt,
    writer: writerOf(page.updatedBy),
  }
}

function noteOf(note: KnowledgeNote) {
  return {
    id: CompanyMemoryNoteId.parse(note.id),
    body: note.text,
    updatedAt: note.updatedAt,
    writer: writerOf(note.provenance),
  }
}

type Entry = ReturnType<typeof entryOf>
type Note = ReturnType<typeof noteOf>
export type Page = Entry & { body: string; version: number; notes: Note[] }

function changed(error: unknown, id: string): never {
  if (error instanceof KnowledgeConflictError) {
    throw new Failure('COMPANY_MEMORY_CHANGED', { details: { pageId: id } })
  }
  throw error
}

function gone(reason: string): never {
  throw new Failure('NOT_FOUND', { details: { reason } })
}

function org(companyId: CompanyId) {
  return `org:${companyId}`
}

function knowledgeOf(storage: PostgresStore) {
  return new Knowledge({
    id: 'conexus-company',
    storage,
    scopes: SCOPES,
    tools: { read: true, write: false },
    pinnedContext: { maxTokens: 1000 },
  })
}

type Held = ReturnType<typeof knowledgeOf>

/** The company's scope and its instructions, created once and left as they are after (`upsertPage`). */
async function ensure(knowledge: Held, companyId: CompanyId) {
  await knowledge.upsertPage({
    ...{ scope: org(companyId), path: INSTRUCTIONS.key, name: INSTRUCTIONS.name },
  })
}

async function view(knowledge: Held, companyId: CompanyId) {
  const store = await knowledge.getStorage()
  const read = await knowledge.readScopeFor([org(companyId)])
  return { store, read }
}

/** A page of the company with its notes, and whether it is the instructions; else `NOT_FOUND`. */
async function pageOf(knowledge: Held, companyId: CompanyId, pageId: CompanyMemoryPageId) {
  const { store, read } = await view(knowledge, companyId)
  const found = await readKnowledgePage(store, { pageId, read })
  // `deletePage` soft-deletes (Mastra's `pages.d.ts`): a removed page is gone for the screen.
  if (found === null || found.page.isScope || found.page.deletedAt !== undefined)
    return gone('PAGE')
  const shown: Page = {
    ...entryOf(found.page),
    body: found.page.body ?? '',
    version: found.page.version,
    notes: found.notes.map(noteOf),
  }
  return { shown, instructions: found.page.key === INSTRUCTIONS.key }
}

/** The instructions and the pages under the company's scope, its first level. */
async function listOf(knowledge: Held, companyId: CompanyId) {
  await ensure(knowledge, companyId)
  const { store, read } = await view(knowledge, companyId)
  const [scope] = await store.getScopesByAddress([org(companyId)])
  const instructions =
    scope === undefined
      ? null
      : await store.getPageByPath({ scopeId: scope.id, path: [INSTRUCTIONS.key], read })
  if (scope === undefined || instructions === null) return gone('COMPANY_SCOPE')
  const level = await listKnowledgeTreeChildren(store, { parentId: scope.id, read, limit: LISTED })
  const pages = level.pages.filter((each) => !each.isScope && each.id !== instructions.id)
  const shown = await pageOf(knowledge, companyId, CompanyMemoryPageId.parse(instructions.id))
  return { instructions: shown.shown, pages: pages.map(entryOf) }
}

type PageChange = { pageId: CompanyMemoryPageId; name: string; body: string; version: number }

/**
 * Replaces a page; the instructions as Mastra's host writes them (the last wins, under their
 * ceiling), any other page against the version read.
 */
async function writePage(
  knowledge: Held,
  companyId: CompanyId,
  input: PageChange,
  writer: PersonId,
) {
  const author = `${PERSON}${writer}`
  if ((await pageOf(knowledge, companyId, input.pageId)).instructions) {
    if (input.body.length > COMPANY_INSTRUCTIONS_MAX) {
      throw new Failure('REQUEST_MALFORMED', { details: { reason: 'INSTRUCTIONS_MAX' } })
    }
    await knowledge.upsertPage({
      ...{ scope: org(companyId), path: INSTRUCTIONS.key, name: INSTRUCTIONS.name },
      ...{ body: input.body, author },
    })
  } else {
    const { store } = await view(knowledge, companyId)
    await store
      .updatePage({
        ...{ id: input.pageId, expectedVersion: input.version },
        ...{ name: input.name, body: input.body, provenance: { author } },
      })
      .catch((error: unknown) => changed(error, input.pageId))
  }
  return (await pageOf(knowledge, companyId, input.pageId)).shown
}

/** Removes a page against the version read; the instructions are declared, so they stay. */
async function removePage(
  knowledge: Held,
  companyId: CompanyId,
  input: { pageId: CompanyMemoryPageId; version: number },
  writer: PersonId,
) {
  if ((await pageOf(knowledge, companyId, input.pageId)).instructions) {
    throw new Failure('REQUEST_MALFORMED', { details: { reason: 'INSTRUCTIONS_STAY' } })
  }
  const { store } = await view(knowledge, companyId)
  await store
    .deletePage({
      id: input.pageId,
      expectedVersion: input.version,
      deletedBy: `${PERSON}${writer}`,
    })
    .catch((error: unknown) => changed(error, input.pageId))
}

/**
 * A new page under the company's scope, saved from a proposal's card: its path is the save's attempt
 * key, so a repeated save finds the page it made and leaves it as it is now.
 */
async function createPage(
  knowledge: Held,
  companyId: CompanyId,
  input: { attemptKey: string; name: string; body: string },
  writer: PersonId,
) {
  await ensure(knowledge, companyId)
  const { store, read } = await view(knowledge, companyId)
  const [scope] = await store.getScopesByAddress([org(companyId)])
  if (scope === undefined) return gone('COMPANY_SCOPE')
  const path = [input.attemptKey]
  const page =
    (await store.getPageByPath({ scopeId: scope.id, path, read })) ??
    (
      await knowledge.upsertPage({
        ...{ scope: org(companyId), path: input.attemptKey, name: input.name, body: input.body },
        author: `${PERSON}${writer}`,
      })
    ).page
  return (await pageOf(knowledge, companyId, CompanyMemoryPageId.parse(page.id))).shown
}

/** A note on a page of the company, saved from a proposal's card; the attempt key is its id. */
async function addNote(
  knowledge: Held,
  companyId: CompanyId,
  input: { attemptKey: string; pageId: CompanyMemoryPageId; text: string },
  writer: PersonId,
) {
  await pageOf(knowledge, companyId, input.pageId)
  const { store, read } = await view(knowledge, companyId)
  const [scope] = await store.getScopesByAddress([org(companyId)])
  if (scope === undefined) return gone('COMPANY_SCOPE')
  const id = input.attemptKey
  const note =
    (await store.getNote({ id, read })) ??
    (await store.addNote({
      ...{ id, pageId: input.pageId, text: input.text, stampScopeIds: [scope.id], mentions: [] },
      provenance: { author: `${PERSON}${writer}` },
    }))
  return noteOf(note)
}

/** A note of the company, else `NOT_FOUND`: another company's note is not found. */
async function held(knowledge: Held, companyId: CompanyId, noteId: CompanyMemoryNoteId) {
  const { store, read } = await view(knowledge, companyId)
  if ((await store.getNote({ id: noteId, read })) === null) gone('NOTE')
}

/**
 * The company's memory (alignment of the Assistant, U9): Mastra's `Knowledge` in Mastra's own store,
 * the one file of Conexus that speaks to it, as the API is experimental. The screen reads as the
 * Factory does (`factory/src/routes/knowledge.ts:117-161`), by the company's scope alone; it writes
 * pages and notes by id, since a page the model makes may have no path.
 */
export function companyMemory(storage: PostgresStore) {
  const knowledge = knowledgeOf(storage)
  return Object.freeze({
    knowledge,
    ensure: (companyId: CompanyId) => ensure(knowledge, companyId),
    list: (companyId: CompanyId) => listOf(knowledge, companyId),
    page: async (companyId: CompanyId, pageId: CompanyMemoryPageId) =>
      (await pageOf(knowledge, companyId, pageId)).shown,
    writePage: (companyId: CompanyId, input: PageChange, writer: PersonId) =>
      writePage(knowledge, companyId, input, writer),
    removePage: (
      companyId: CompanyId,
      input: { pageId: CompanyMemoryPageId; version: number },
      writer: PersonId,
    ) => removePage(knowledge, companyId, input, writer),
    /** Replaces a note's text, as Mastra's host does: a new note, with a new id. */
    async writeNote(
      companyId: CompanyId,
      noteId: CompanyMemoryNoteId,
      text: string,
      writer: PersonId,
    ) {
      await held(knowledge, companyId, noteId)
      return noteOf(await knowledge.updateNote({ id: noteId, text, author: `${PERSON}${writer}` }))
    },
    createPage: (
      companyId: CompanyId,
      input: { attemptKey: string; name: string; body: string },
      writer: PersonId,
    ) => createPage(knowledge, companyId, input, writer),
    addNote: (
      companyId: CompanyId,
      input: { attemptKey: string; pageId: CompanyMemoryPageId; text: string },
      writer: PersonId,
    ) => addNote(knowledge, companyId, input, writer),
    async removeNote(companyId: CompanyId, noteId: CompanyMemoryNoteId, writer: PersonId) {
      await held(knowledge, companyId, noteId)
      const removed = await knowledge.removeNote({ id: noteId, author: `${PERSON}${writer}` })
      if (removed === null) gone('NOTE')
    },
  })
}

export type CompanyMemory = ReturnType<typeof companyMemory>

/**
 * The agent's `knowledge` and `scopes`: the incoming scopes, which hold the run's thread and
 * resource, then its company's, which exists before the model is first asked. Outside a
 * conversation, no company: the run reads only what is its own (fail closed, as Mastra Code's
 * `knowledge-scope.ts:35`).
 */
export function companyScopes(deps: { memory: CompanyMemory; scopeOf: ScopeOf }) {
  async function scopes(input: { scopes: string[]; requestContext: RequestContext }) {
    const scope = await deps.scopeOf(input.requestContext)
    if (scope === undefined) return input.scopes
    await deps.memory.ensure(scope.companyId)
    return [...input.scopes, org(scope.companyId)]
  }
  return { knowledge: deps.memory.knowledge, scopes }
}
