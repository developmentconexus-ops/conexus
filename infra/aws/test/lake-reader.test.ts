import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Call } from './iam.ts'
import { mayAssume } from './iam.ts'
import { lake } from './lake-model.ts'
import type { Statement } from './policies.ts'
import { ACCOUNT, find, readable, statementsOf, trustOf } from './policies.ts'

const HUB = `arn:aws:iam::${ACCOUNT}:role/conexus-hub`
const A = 'EmpresaTesteA0000000000000000001'
const B = 'EmpresaTesteB0000000000000000002'

test('o leitor só confia no Hub com as duas etiquetas', () => {
  const thisCompany = {
    'aws:PrincipalTag/conexus-empresa': '{CompanyId}',
    'aws:RequestTag/conexus-empresa': '{CompanyId}',
  }
  const common = {
    Effect: 'Allow',
    Principal: { AWS: `arn:aws:iam::${ACCOUNT}:root` },
  }
  assert.deepEqual(trustOf(find(lake, 'Reader')), [
    {
      ...common,
      Action: 'sts:AssumeRole',
      Condition: {
        ArnEquals: { 'aws:PrincipalArn': HUB },
        StringEquals: thisCompany,
        Null: { 'aws:RequestTag/conexus-leitor': 'false' },
      },
    },
    {
      ...common,
      Action: 'sts:TagSession',
      Condition: {
        ArnEquals: { 'aws:PrincipalArn': HUB },
        StringEquals: thisCompany,
        'ForAllValues:StringEquals': { 'aws:TagKeys': ['conexus-empresa', 'conexus-leitor'] },
        Null: { 'aws:TagKeys': 'false' },
      },
    },
  ])
})

/** The reader of one company's lake, as IAM would hold it once the stack exists. */
function readerOf(company: string): Statement[] {
  return JSON.parse(
    JSON.stringify(trustOf(find(lake, 'Reader'))).replaceAll('{CompanyId}', company),
  )
}

function asks(session: string, reader: string, tags: Record<string, string>) {
  return ['sts:AssumeRole', 'sts:TagSession'].map((action) => ({
    action,
    resource: `arn:aws:iam::${ACCOUNT}:role/conexus-${reader}-leitor`,
    principalArn: HUB,
    principalTags: { 'conexus-empresa': session },
    requestTags: tags,
  }))
}

function assumes(identity: Statement[], calls: Call[], trust: Statement[]): boolean {
  return calls.every((call) => mayAssume(trust, identity, call))
}

test('a sessão de A não assume o leitor de B, e o Hub sem sts:AssumeRole não assume nenhum', () => {
  const hub = statementsOf(find(readable('platform'), 'HubRole'))
  const ofA = { 'conexus-empresa': A, 'conexus-leitor': 'r1' }
  const ofB = { 'conexus-empresa': B, 'conexus-leitor': 'r1' }
  assert.equal(assumes(hub, asks(A, 'lagodeaaaaaa', ofA), readerOf(A)), false)
  assert.equal(assumes(hub, asks(A, 'lagodebbbbbb', ofB), readerOf(B)), false)

  // The step that first lets the Hub read (step 3) gives its policy sts:AssumeRole on the readers.
  const step3: Statement[] = [
    {
      Effect: 'Allow',
      Action: ['sts:AssumeRole', 'sts:TagSession'],
      Resource: `arn:aws:iam::${ACCOUNT}:role/conexus-*-leitor`,
    },
  ]
  assert.equal(assumes(step3, asks(A, 'lagodeaaaaaa', ofA), readerOf(A)), true)
  assert.equal(assumes(step3, asks(A, 'lagodebbbbbb', ofB), readerOf(B)), false)
  assert.equal(assumes(step3, asks(A, 'lagodebbbbbb', ofA), readerOf(B)), false)
  assert.equal(
    assumes(step3, asks(A, 'lagodeaaaaaa', { 'conexus-empresa': A }), readerOf(A)),
    false,
  )
  const third = { ...ofA, 'conexus-outra': 'x' }
  assert.equal(assumes(step3, asks(A, 'lagodeaaaaaa', third), readerOf(A)), false)
})
