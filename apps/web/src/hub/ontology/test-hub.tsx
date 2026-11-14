import type {
  ConceptPage,
  ConceptRow,
  OntologyView,
  ProposalItemView,
  ProposalView,
  RevisionEntry,
} from '@conexus/hub-api'
import {
  ATTEMPT_KEY_HEADER,
  ConceptPage as ConceptPageSchema,
  OntologyProposalId,
  OntologyView as OntologyViewSchema,
  ProposalItemView as ProposalItemViewSchema,
  ProposalView as ProposalViewSchema,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import type { hubServer } from '../../platform/test-hub.tsx'
import { PEDIDOS, projectsRead, refusal } from '../../platform/test-hub.tsx'

const PROPOSAL = OntologyProposalId.parse('77777777-7777-4777-8777-777777777777')
export const KNOWLEDGE = `/companies/${COMPANY.id}/knowledge`
const BASE = `*/api/companies/${COMPANY.id}/ontology`

export function conceptRow(fields: Partial<ConceptRow> = {}): ConceptRow {
  return {
    key: 'documento',
    name: 'Documento',
    plural: 'Documentos',
    description: 'Um documento de venda.',
    synonyms: ['venda'],
    titleField: 'numero',
    keyFields: ['nunota'],
    base: null,
    state: 'ACTIVE',
    replacedBy: null,
    fields: 2,
    codes: 2,
    source: 'Sankhya Matriz',
    ...fields,
  }
}

export function view(fields: Partial<OntologyView> = {}): OntologyView {
  return OntologyViewSchema.parse({
    revision: {
      number: 2,
      hash: 'abcdef0123456789',
      proposedBy: 'Ana Lima',
      approvedBy: 'Administrador',
      approvedAt: '2026-11-12T10:02:00.000Z',
    },
    concepts: [
      conceptRow(),
      conceptRow({ key: 'cliente', name: 'Cliente', base: 'parceiro', fields: 1, codes: 0 }),
    ],
    toReview: 0,
    mayApprove: true,
    awaits: null,
    ...fields,
  })
}

/** Documento with a list field of two codes, as the concept's page reads it. */
export function page(fields: Partial<ConceptPage> = {}): ConceptPage {
  return ConceptPageSchema.parse({
    concept: conceptRow(),
    fields: [
      {
        concept: 'documento',
        key: 'nunota',
        name: 'Número único',
        description: '',
        type: 'ID',
        currency: null,
        unit: null,
        column: 'NUNOTA',
        state: 'ACTIVE',
      },
      {
        concept: 'documento',
        key: 'numero',
        name: 'Número do documento',
        description: '',
        type: 'TEXT',
        currency: null,
        unit: null,
        column: 'NUMNOTA',
        state: 'ACTIVE',
      },
      {
        concept: 'documento',
        key: 'tipo',
        name: 'Tipo de operação',
        description: '',
        type: 'CODE',
        currency: null,
        unit: null,
        column: 'CODTIPOPER',
        state: 'ACTIVE',
      },
    ],
    codes: [
      {
        concept: 'documento',
        field: 'tipo',
        value: '100',
        label: 'Venda de balcão',
        description: null,
        origin: 'DICTIONARY',
        state: 'ACTIVE',
      },
      {
        concept: 'documento',
        field: 'tipo',
        value: '101',
        label: 'Pedido externo',
        description: 'Venda tirada fora da loja.',
        origin: 'PERSON',
        state: 'ACTIVE',
      },
    ],
    relations: [],
    source: {
      connectionId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      connectionName: 'Sankhya Matriz',
      sql: 'SELECT NUNOTA FROM TGFCAB',
      proof: {
        outcome: 'OK',
        reason: null,
        rows: 1240,
        columns: ['NUNOTA'],
        ranAt: '2026-11-12T10:02:00.000Z',
      },
    },
    ...fields,
  })
}

/** A proposal of one label change over the code 101, as Para revisar lists it. */
export function proposal(fields: Partial<ProposalView> = {}): ProposalView {
  return ProposalViewSchema.parse({
    id: PROPOSAL,
    demand: 'O 101 é o pedido do representante',
    proposedBy: 'Membro',
    agent: null,
    createdAt: '2026-11-12T11:00:00.000Z',
    baseRevision: 2,
    state: 'OPEN',
    items: [
      {
        n: 1,
        target: 'documento.tipo=101',
        item: {
          kind: 'RENAME_LABEL',
          target: 'documento.tipo=101',
          name: 'Pedido do representante',
        },
        before: {
          kind: 'CODE',
          concept: 'documento',
          field: 'tipo',
          value: '101',
          label: 'Pedido externo',
          description: null,
          origin: 'PERSON',
          state: 'ACTIVE',
        },
        targetName: 'Documento › Tipo de operação 101',
        proof: null,
        connectionName: null,
        decision: 'PENDING',
        reason: null,
        decidedBy: null,
        decidedAt: null,
      },
    ],
    ...fields,
  })
}

export type Held = {
  view: OntologyView
  concepts?: Record<string, ConceptPage>
  proposals?: ProposalView[]
  revisions?: RevisionEntry[]
  /** What a suggestion or a decision answers instead of the Hub's success. */
  suggest?: () => Response | undefined
  decide?: () => Response | undefined
}

type Sent = { path: string; body: unknown; key: string | null }

/** The Hub's Conhecimento on `server`; `sent` holds every write with its attempt key. */
export function openKnowledge(
  server: ReturnType<typeof hubServer>,
  held: Held,
  path: string,
  role = 'owner',
) {
  const sent: Sent[] = []
  async function note(request: Request) {
    sent.push({
      path: new URL(request.url).pathname,
      body: await request.json(),
      key: request.headers.get(ATTEMPT_KEY_HEADER),
    })
  }
  server.use(
    http.get(BASE, () => HttpResponse.json(held.view)),
    http.get(`${BASE}/concepts/:concept`, ({ params }) => {
      const found = held.concepts?.[String(params.concept)]
      return found === undefined ? refusal('CONCEPT_UNKNOWN') : HttpResponse.json(found)
    }),
    http.get(`${BASE}/proposals`, () => HttpResponse.json({ proposals: held.proposals ?? [] })),
    http.get(`${BASE}/revisions`, () => HttpResponse.json({ revisions: held.revisions ?? [] })),
    http.post(`${BASE}/proposals`, async ({ request }) => {
      await note(request)
      return held.suggest?.() ?? HttpResponse.json({ proposalId: PROPOSAL }, { status: 201 })
    }),
    http.post(`${BASE}/proposals/:id/decisions`, async ({ request }) => {
      await note(request)
      return held.decide?.() ?? HttpResponse.json({ revision: 3 })
    }),
  )
  server.use(...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: false, role }))
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [path] }))} />)
  return { sent }
}

/** A phone: narrow, and a finger for a pointer, for the length of one test. */
export async function onPhone<T>(run: () => Promise<T>): Promise<T> {
  const phone = vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: media.includes('767') || media.includes('coarse'),
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
  try {
    return await run()
  } finally {
    phone.mockRestore()
  }
}

/** A proposal's source of a concept, with the proof that read it: where it is read from and how many rows. */
export function sourceItem(fields: Partial<ProposalItemView> = {}): ProposalItemView {
  return ProposalItemViewSchema.parse({
    n: 2,
    target: 'documento',
    item: { kind: 'SET_SOURCE', concept: 'documento', sql: 'SELECT NUNOTA\nFROM TGFCAB' },
    before: null,
    targetName: null,
    proof: {
      outcome: 'OK',
      reason: null,
      rows: 1240,
      columns: ['NUNOTA'],
      ranAt: '2026-11-12T10:02:00.000Z',
    },
    connectionName: 'Sankhya Matriz',
    decision: 'PENDING',
    reason: null,
    decidedBy: null,
    decidedAt: null,
    ...fields,
  })
}
