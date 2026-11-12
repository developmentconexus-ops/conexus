import type { PersonId } from '@conexus/hub-api'
import {
  listCompanyMemory,
  readCompanyMemoryPage,
  removeCompanyMemoryNote,
  removeCompanyMemoryPage,
  writeCompanyMemoryNote,
  writeCompanyMemoryPage,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import type { CompanyMemory, Page } from './company-memory.ts'
import type { Owner } from './context.ts'

type Deps = { database: Database; identity: IdentityPorts; company: CompanyMemory }

/** The refusal's label, in the phrase of `NOT_IN_ROLE`. */
const OPERATION = 'a memória da empresa'

/** Every member reads the company's memory (`readCompany`); the role says whether they may change it. */
function mayManage(deps: Deps, owner: Owner): Promise<boolean> {
  return deps.database.read({ kind: 'COMPANY', ...owner }, async (tx) => {
    const admitted = await deps.identity.admitMember({ tx, ...owner, action: 'readCompany' })
    return deps.identity.allows(admitted.role, 'manageCompanyMemory')
  })
}

/** A change: a member whose role holds "Memória da empresa"; another member, `NOT_IN_ROLE` (U9). */
async function admitWriter(deps: Deps, owner: Owner): Promise<PersonId> {
  if (!(await mayManage(deps, owner))) {
    throw new Failure('NOT_IN_ROLE', { named: { operation: OPERATION } })
  }
  return owner.personId
}

/** The names of whoever wrote last, read in the Hub; the Assistant's writes name nobody. */
function namesOf(deps: Deps, owner: Owner, written: readonly { writer: PersonId | null }[]) {
  const ids = [...new Set(written.flatMap((each) => (each.writer === null ? [] : [each.writer])))]
  return deps.database.read({ kind: 'COMPANY', ...owner }, async (tx) => {
    const named = await Promise.all(
      ids.map(async (id) => [id, await deps.identity.personNameOf(tx, id)] as const),
    )
    return new Map(named)
  })
}

type Names = Awaited<ReturnType<typeof namesOf>>

/** A page or a note as the screen reads it: its instant in UTC and its writer's name. */
function authored<T extends { writer: PersonId | null; updatedAt: Date }>(item: T, names: Names) {
  const { writer, updatedAt, ...rest } = item
  return {
    ...rest,
    updatedAt: updatedAt.toISOString(),
    author: (writer === null ? undefined : names.get(writer)) ?? null,
  }
}

async function shownPage(deps: Deps, owner: Owner, page: Page) {
  const names = await namesOf(deps, owner, [page, ...page.notes])
  const { notes, ...entry } = page
  return { ...authored(entry, names), notes: notes.map((note) => authored(note, names)) }
}

/**
 * Configurações › Memória da empresa (alignment of the Assistant, U9): every member reads what the
 * Assistant follows in the company; an owner or an administrator corrects and removes it. The
 * company comes from the path and is admitted with the person; its scope alone is read.
 */
export function registerCompanyMemoryRoutes(app: FastifyInstance, deps: Deps): void {
  const memory = deps.company
  serve(app, listCompanyMemory, async (input) => {
    const owner = { companyId: input.params.companyId, personId: input.person.id }
    const may = await mayManage(deps, owner)
    const { instructions, pages } = await memory.list(owner.companyId)
    const names = await namesOf(deps, owner, pages)
    return answer({
      instructions: await shownPage(deps, owner, instructions),
      pages: pages.map((each) => authored(each, names)),
      mayManage: may,
    })
  })

  serve(app, readCompanyMemoryPage, async (input) => {
    const owner = { companyId: input.params.companyId, personId: input.person.id }
    await mayManage(deps, owner)
    const page = await memory.page(owner.companyId, input.params.pageId)
    return answer({ page: await shownPage(deps, owner, page) })
  })

  serve(app, writeCompanyMemoryPage, async (input) => {
    const owner = { companyId: input.params.companyId, personId: input.person.id }
    const writer = await admitWriter(deps, owner)
    const { pageId } = input.params
    const page = await memory.writePage(owner.companyId, { pageId, ...input.body }, writer)
    return answer({ page: await shownPage(deps, owner, page) })
  })

  serve(app, removeCompanyMemoryPage, async (input) => {
    const owner = { companyId: input.params.companyId, personId: input.person.id }
    const writer = await admitWriter(deps, owner)
    const { pageId } = input.params
    await memory.removePage(owner.companyId, { pageId, version: input.query.version }, writer)
    return answer(undefined)
  })

  serve(app, writeCompanyMemoryNote, async (input) => {
    const owner = { companyId: input.params.companyId, personId: input.person.id }
    const writer = await admitWriter(deps, owner)
    const note = await memory.writeNote(
      owner.companyId,
      input.params.noteId,
      input.body.body,
      writer,
    )
    const names = await namesOf(deps, owner, [note])
    return answer({ note: authored(note, names) })
  })

  serve(app, removeCompanyMemoryNote, async (input) => {
    const owner = { companyId: input.params.companyId, personId: input.person.id }
    const writer = await admitWriter(deps, owner)
    await memory.removeNote(owner.companyId, input.params.noteId, writer)
    return answer(undefined)
  })
}
