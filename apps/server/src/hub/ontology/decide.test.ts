import assert from 'node:assert/strict'
import { test } from 'node:test'
import { queued, withOwnerLock } from '../../platform/test-database.ts'
import { codeOf } from '../identity/test-hub.ts'
import type { Seeded } from './test-decide.ts'
import { companyOfFour, conceptItems, rename, stored, VENDEDOR } from './test-decide.ts'

function gapsOf(response: { json(): unknown }) {
  return Object(response.json()).gaps
}

test('a primeira é do dono: quem não é dono recebe FIRST_REVISION_OWNER e nada se grava', async (t) => {
  const on = await companyOfFour(t)
  const first = await on.proposed(on.member, VENDEDOR)
  assert.equal(Object((await on.read(on.member)).json()).awaits, 'OWNER')
  for (const who of [on.admin, on.developer, on.member]) {
    const refused = await on.approveAll(who, first, 4, 0)
    assert.equal(refused.statusCode, 403, refused.body)
    assert.equal(codeOf(refused), 'FIRST_REVISION_OWNER')
  }
  assert.deepEqual(await stored(on.hub), {
    revisions: [],
    decisions: ['PENDING', 'PENDING', 'PENDING', 'PENDING'],
  })
  const approved = await on.approveAll(on.owner, first, 4, 0)
  assert.equal(approved.statusCode, 200, approved.body)
  assert.deepEqual(approved.json(), { revision: 1 })
  const view = Object((await on.read(on.member)).json())
  assert.deepEqual(
    view.concepts.map((each: { key: string }) => each.key),
    ['vendedor'],
  )
  assert.equal(view.revision.number, 1)
  assert.match(view.revision.hash, /^[0-9a-f]{64}$/)
  assert.deepEqual([view.mayApprove, view.awaits, view.toReview], [false, 'APPROVER', 0])
  const [proposal] = await on.hub.test.asOwner('select state from ontology.proposal')
  assert.equal(proposal?.state, 'CLOSED')
})

test('L1 e R1: depois da primeira, membro e desenvolvedor recebem NOT_IN_ROLE; dono e administrador aprovam, a própria também', async (t) => {
  const on = await companyOfFour(t)
  assert.equal(
    (await on.approveAll(on.owner, await on.proposed(on.owner, VENDEDOR), 4, 0)).statusCode,
    200,
  )
  const ofMember = await on.proposed(on.member, [rename('vendedor', 'Vendedor externo')])
  for (const who of [on.member, on.developer]) {
    const refused = await on.approveAll(who, ofMember, 1, 1)
    assert.equal(refused.statusCode, 409, refused.body)
    assert.equal(codeOf(refused), 'NOT_IN_ROLE')
    assert.match(Object(refused.json()).title, /os conceitos da empresa/)
  }
  const open = Object((await on.read(on.member, '/proposals?state=OPEN')).json()).proposals
  assert.equal(open[0].items[0].before.name, 'vendedor')
  assert.equal(open[0].items[0].item.name, 'Vendedor externo')
  assert.equal((await on.approveAll(on.admin, ofMember, 1, 1)).statusCode, 200)
  const ofAdmin = await on.proposed(on.admin, [rename('vendedor.nome', 'Apelido')])
  assert.equal((await on.approveAll(on.admin, ofAdmin, 1, 2)).statusCode, 200)
  const ofDeveloper = await on.proposed(on.developer, [rename('vendedor', 'Vendedor')])
  assert.equal((await on.approveAll(on.owner, ofDeveloper, 1, 3)).statusCode, 200)
  const { revisions } = await stored(on.hub)
  assert.deepEqual(revisions.slice(1), [
    { number: 2, proposed_by: on.member.id, approved_by: on.admin.id },
    { number: 3, proposed_by: on.admin.id, approved_by: on.admin.id },
    { number: 4, proposed_by: on.developer.id, approved_by: on.owner.id },
  ])
  const history = Object((await on.read(on.member, '/revisions')).json()).revisions
  assert.deepEqual(history[2], {
    ...history[2],
    ...{ number: 2, proposedBy: 'Davi Souza', approvedBy: 'Bruno Reis' },
  })
})

test('a revisão esperada: uma revisão velha recusa com REVISION_STALE; duas decisões ao mesmo tempo, uma grava e a outra REVISION_STALE', async (t) => {
  const on = await companyOfFour(t)
  assert.equal(
    (await on.approveAll(on.owner, await on.proposed(on.owner, VENDEDOR), 4, 0)).statusCode,
    200,
  )
  const one = await on.proposed(on.owner, [rename('vendedor', 'Um')])
  const other = await on.proposed(on.member, [rename('vendedor.nome', 'Outro')])
  const stale = await on.approveAll(on.admin, one, 1, 0)
  assert.equal(stale.statusCode, 412, stale.body)
  assert.equal(codeOf(stale), 'REVISION_STALE')
  assert.equal((await stored(on.hub)).revisions.length, 1)
  // Both read revision 1 and wait on their proposal's lock; released together, they meet on revision 2.
  const lock = 'select 1 from ontology.proposal where id = any($1::uuid[]) for update'
  const answers = await withOwnerLock(on.hub.test, lock, [[one, other]], async (release) => {
    const pending = [on.approveAll(on.admin, one, 1, 1), on.approveAll(on.owner, other, 1, 1)]
    await queued(on.hub.test, 2, Promise.all(pending))
    await release()
    return Promise.all(pending)
  })
  assert.deepEqual(answers.map((each) => each.statusCode).sort(), [200, 412])
  assert.deepEqual(answers.map(codeOf).filter(Boolean), ['REVISION_STALE'])
  const { revisions, decisions } = await stored(on.hub)
  assert.equal(revisions.length, 2)
  assert.deepEqual(decisions.filter((each) => each === 'PENDING').length, 1)
})

test('o conjunto fechado: sem a fonte, sem o conceito, sem o campo ou sem o substituto, DECISION_INCOMPLETE com os itens; um item decidido, ITEM_DECIDED', async (t) => {
  const on = await companyOfFour(t)
  const first = await on.proposed(on.owner, VENDEDOR)
  const noSource = await on.decide(on.owner, first, {
    approved: [1, 2, 3],
    refused: [],
    expectedRevision: 0,
  })
  assert.equal(noSource.statusCode, 422, noSource.body)
  assert.equal(codeOf(noSource), 'DECISION_INCOMPLETE')
  assert.deepEqual(gapsOf(noSource), [
    { n: 1, target: 'vendedor', needs: 'SOURCE', address: 'vendedor' },
  ])
  const noConcept = await on.decide(on.owner, first, {
    approved: [2],
    refused: [],
    expectedRevision: 0,
  })
  assert.deepEqual(gapsOf(noConcept), [
    { n: 2, target: 'vendedor.codigo', needs: 'CONCEPT', address: 'vendedor' },
  ])
  assert.deepEqual((await stored(on.hub)).decisions, ['PENDING', 'PENDING', 'PENDING', 'PENDING'])
  assert.equal((await on.approveAll(on.owner, first, 4, 0)).statusCode, 200)
  const again = await on.decide(on.owner, first, {
    approved: [1],
    refused: [],
    expectedRevision: 1,
  })
  assert.equal(again.statusCode, 409, again.body)
  assert.equal(codeOf(again), 'ITEM_DECIDED')
  const code: Seeded = {
    kind: 'SET_CODE',
    target: 'vendedor.tipo=1',
    content: { concept: 'vendedor', field: 'tipo', value: '1', label: 'Interno' },
  }
  const replaced: Seeded = {
    kind: 'DEPRECATE',
    target: 'vendedor',
    content: { target: 'vendedor', reason: 'outro nome', replacedBy: 'representante' },
  }
  const loose = await on.proposed(on.owner, [code, replaced])
  const missing = await on.approveAll(on.owner, loose, 2, 1)
  assert.deepEqual(gapsOf(missing), [
    { n: 1, target: 'vendedor.tipo=1', needs: 'FIELD', address: 'vendedor.tipo' },
    { n: 2, target: 'vendedor', needs: 'REPLACEMENT', address: 'representante' },
  ])
  const refusedOnly = await on.decide(on.owner, loose, {
    approved: [],
    refused: [
      { n: 1, reason: 'não existe' },
      { n: 2, reason: 'não agora' },
    ],
    expectedRevision: 1,
  })
  assert.deepEqual(refusedOnly.json(), { revision: null })
})

const PARCEIRO = conceptItems('parceiro', [{ key: 'codigo', column: 'CODPARC', type: 'ID' }], {
  keyFields: ['codigo'],
  titleField: 'codigo',
})
const CLIENTE = conceptItems('cliente', [{ key: 'codigo', column: 'CODPARC', type: 'ID' }], {
  keyFields: ['codigo'],
  titleField: 'codigo',
  base: 'parceiro',
})

test('o papel e a base: um papel sem a base, ou aposentar a base de um papel ativo, DECISION_INCOMPLETE e nada se grava', async (t) => {
  const on = await companyOfFour(t)
  const both = await on.proposed(on.owner, [...PARCEIRO, ...CLIENTE])
  const roleAlone = await on.decide(on.owner, both, {
    approved: [4, 5, 6],
    refused: [],
    expectedRevision: 0,
  })
  assert.equal(codeOf(roleAlone), 'DECISION_INCOMPLETE')
  assert.deepEqual(gapsOf(roleAlone), [
    { n: 4, target: 'cliente', needs: 'BASE', address: 'parceiro' },
  ])
  assert.equal((await stored(on.hub)).revisions.length, 0)
  assert.equal((await on.approveAll(on.owner, both, 6, 0)).statusCode, 200)
  const retire = await on.proposed(on.owner, [
    { kind: 'DEPRECATE', target: 'parceiro', content: { target: 'parceiro', reason: 'saiu' } },
  ])
  const refused = await on.approveAll(on.owner, retire, 1, 1)
  assert.equal(codeOf(refused), 'DECISION_INCOMPLETE')
  assert.deepEqual(gapsOf(refused), [
    { n: 1, target: 'cliente', needs: 'BASE', address: 'parceiro' },
    { n: 1, target: 'parceiro', needs: 'ACTIVE_ROLE', address: 'cliente' },
  ])
  assert.equal((await stored(on.hub)).revisions.length, 1)
})

test('a junção: Documento com Documento pela Origem do item, aprovada, aparece com os dois nomes e a junção', async (t) => {
  const on = await companyOfFour(t)
  const documento = conceptItems('documento', [{ key: 'numero', column: 'NUNOTA', type: 'ID' }], {
    keyFields: ['numero'],
    titleField: 'numero',
  })
  const origem = conceptItems(
    'origem_item',
    [
      { key: 'destino', column: 'NUNOTA', type: 'ID' },
      { key: 'origem', column: 'NUNOTAORIG', type: 'ID' },
    ],
    { keyFields: ['destino', 'origem'], titleField: 'destino' },
  )
  const relation = {
    ...{ key: 'veio_de', from: 'documento', to: 'documento', cardinality: 'MANY_TO_MANY' },
    ...{ pairs: [['numero', 'destino']], fromName: 'gerou', toName: 'veio de' },
    ...{ through: 'origem_item', throughPairs: [['origem', 'numero']] },
  }
  const link: Seeded = { kind: 'ADD_RELATION', target: '@veio_de', content: { relation } }
  const all = await on.proposed(on.owner, [...documento, ...origem, link])
  const withoutJoin = await on.decide(on.owner, all, {
    approved: [1, 2, 3, 8],
    refused: [],
    expectedRevision: 0,
  })
  assert.equal(codeOf(withoutJoin), 'DECISION_INCOMPLETE')
  assert.deepEqual(
    gapsOf(withoutJoin).map(
      (gap: { needs: string; address: string }) => `${gap.needs} ${gap.address}`,
    ),
    ['CONCEPT origem_item', 'FIELD origem_item.destino', 'FIELD origem_item.origem'],
  )
  assert.equal((await on.approveAll(on.owner, all, 8, 0)).statusCode, 200)
  const page = await on.read(on.member, '/concepts/documento')
  assert.equal(page.statusCode, 200, page.body)
  assert.deepEqual(Object(page.json()).relations, [
    {
      ...{ key: 'veio_de', from: 'documento', to: 'documento', cardinality: 'MANY_TO_MANY' },
      ...{ pairs: [['numero', 'destino']], fromName: 'gerou', toName: 'veio de' },
      ...{ through: 'origem_item', throughPairs: [['origem', 'numero']], state: 'ACTIVE' },
    },
  ])
  const unknown = await on.read(on.member, '/concepts/nenhum')
  assert.equal(codeOf(unknown), 'CONCEPT_UNKNOWN')
})
