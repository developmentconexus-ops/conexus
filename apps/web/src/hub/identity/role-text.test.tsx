import type { ConnectorEntry } from '@conexus/hub-api'
import { RoleView } from '@conexus/hub-api'
import { expect, test } from 'vitest'
import { summaryOf } from './role-text.ts'

function operation(id: string, effect: 'READ' | 'WRITE') {
  return { id, label: id, summary: id, effect, door: false }
}

function kit(
  ...subjects: [string, ('READ' | 'WRITE')[]][]
): Pick<ConnectorEntry, 'id' | 'name' | 'subjects'>[] {
  return [
    {
      id: 'sankhya',
      name: 'Sankhya',
      subjects: subjects.map(([id, effects]) => ({
        id,
        label: id,
        operations: effects.map((effect, at) => operation(`${id}${at}`, effect)),
      })),
    },
  ]
}

function role(kind: RoleView['kind'], held: string[]) {
  return RoleView.parse({
    role: 'papel',
    label: 'Papel',
    kind,
    connectors: { sankhya: held },
    members: 0,
  })
}

const READ_ONLY_KIT = kit(['a', ['READ', 'READ']], ['b', ['READ']])

test('um kit sem escrita: o Desenvolvedor lê tudo e o Dono usa tudo', () => {
  const every = ['a0', 'a1', 'b0']
  expect(summaryOf(role('EDITABLE', every), READ_ONLY_KIT)).toEqual([
    'Lê tudo de todos os conectores',
  ])
  expect(summaryOf(role('ALL', every), READ_ONLY_KIT)).toEqual(['Usa tudo de todos os conectores'])
})

test('um papel com todas as operações de um kit com escrita usa tudo; só as leituras, lê tudo', () => {
  const withWrite = kit(['a', ['READ', 'WRITE']], ['b', ['READ']])
  expect(summaryOf(role('CUSTOM', ['a0', 'a1', 'b0']), withWrite)).toEqual([
    'Usa tudo de todos os conectores',
  ])
  expect(summaryOf(role('EDITABLE', ['a0', 'b0']), withWrite)).toEqual([
    'Lê tudo de todos os conectores',
  ])
})

test('muitos assuntos: uma linha curta por conector', () => {
  const many = kit(['a', ['READ', 'READ']], ['b', ['READ']], ['c', ['READ']], ['d', ['READ']])
  expect(summaryOf(role('EDITABLE', ['a0', 'a1', 'b0', 'c0']), many)).toEqual([
    'Sankhya: 4 operações em 3 assuntos',
  ])
  expect(summaryOf(role('CUSTOM', ['a0']), many)).toEqual(['Sankhya: 1 operação de a'])
})
