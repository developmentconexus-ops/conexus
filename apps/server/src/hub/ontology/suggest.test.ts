import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { codeOf, post } from '../identity/test-hub.ts'
import type { Seeded } from './test-decide.ts'
import { companyOfFour, VENDEDOR } from './test-decide.ts'

const TIPO: Seeded[] = [
  {
    kind: 'ADD_FIELD',
    target: 'vendedor.tipo',
    content: {
      concept: 'vendedor',
      field: { key: 'tipo', name: 'Tipo', description: '', type: 'CODE', column: 'TIPVEND' },
    },
  },
  {
    kind: 'SET_CODE',
    target: 'vendedor.tipo=I',
    content: { concept: 'vendedor', field: 'tipo', value: 'I', label: 'I' },
  },
]

const LABEL = { kind: 'RENAME_LABEL', target: 'vendedor.tipo=I', name: 'Interno' }

test('Sugerir mudança: a sugestão de um membro vira proposta aberta com quem propôs; a mesma chave duas vezes dá uma proposta só', async (t) => {
  const on = await companyOfFour(t)
  const first = await on.proposed(on.owner, [...VENDEDOR, ...TIPO])
  assert.equal((await on.approveAll(on.owner, first, 6, 0)).statusCode, 200)
  const path = `/api/companies/${on.companyId}/ontology/proposals`
  const body = { why: 'o tipo I é o vendedor interno', items: [LABEL] }
  const key = randomUUID()
  const made = await post(on.hub, on.member, path, body, key)
  assert.equal(made.statusCode, 201, made.body)
  const again = await post(on.hub, on.member, path, body, key)
  assert.equal(again.statusCode, 201, again.body)
  assert.deepEqual(again.json(), made.json())
  const rows = await on.hub.test.asOwner(
    `select p.proposed_by, p.agent, p.state, p.base_revision, i.kind, i.target, i.decision
      from ontology.proposal p join ontology.proposal_item i on i.proposal_id = p.id
      where p.id = $1`,
    [Object(made.json()).proposalId],
  )
  assert.deepEqual(rows, [
    {
      ...{ proposed_by: on.member.id, agent: null, state: 'OPEN', base_revision: 1 },
      ...{ kind: 'RENAME_LABEL', target: 'vendedor.tipo=I', decision: 'PENDING' },
    },
  ])
  const conflict = await post(on.hub, on.member, path, { ...body, why: 'outro' }, key)
  assert.equal(codeOf(conflict), 'IDEMPOTENCY_CONFLICT')
  const view = Object((await on.read(on.member)).json())
  assert.equal(view.toReview, 1)
  // The decision makes the code the person's.
  const approved = await on.approveAll(on.admin, Object(made.json()).proposalId, 1, 1)
  assert.equal(approved.statusCode, 200, approved.body)
  const page = Object((await on.read(on.member, '/concepts/vendedor')).json())
  assert.deepEqual(page.codes[0], {
    ...{ concept: 'vendedor', field: 'tipo', value: 'I', label: 'Interno' },
    ...{ description: null, origin: 'PERSON', state: 'ACTIVE' },
  })
})

test('Sugerir mudança: um alvo que não existe, TARGET_UNKNOWN; um código novo, REQUEST_MALFORMED, porque a rota não o aceita; nada se grava', async (t) => {
  const on = await companyOfFour(t)
  const first = await on.proposed(on.owner, [...VENDEDOR, ...TIPO])
  assert.equal((await on.approveAll(on.owner, first, 6, 0)).statusCode, 200)
  const path = `/api/companies/${on.companyId}/ontology/proposals`
  const gone = await post(on.hub, on.member, path, {
    why: 'renomear',
    items: [{ kind: 'RENAME_LABEL', target: 'cliente', name: 'Cliente' }],
  })
  assert.equal(gone.statusCode, 404, gone.body)
  assert.equal(codeOf(gone), 'TARGET_UNKNOWN')
  const fresh = await post(on.hub, on.member, path, {
    why: 'um tipo novo',
    items: [{ kind: 'SET_CODE', concept: 'vendedor', field: 'tipo', value: 'E', label: 'Externo' }],
  })
  assert.equal(codeOf(fresh), 'REQUEST_MALFORMED')
  const repeated = await post(on.hub, on.member, path, { why: 'duas vezes', items: [LABEL, LABEL] })
  assert.equal(codeOf(repeated), 'REQUEST_MALFORMED')
  const proposals = await on.hub.test.asOwner('select id from ontology.proposal')
  assert.equal(proposals.length, 1)
})
