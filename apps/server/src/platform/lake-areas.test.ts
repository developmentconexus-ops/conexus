import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { COPY_AREAS, TREAT_AREAS } from '../../../../infra/aws/lib/actions.ts'
import { LAKE_AREAS } from './lake-areas.ts'

const LAKE_TEMPLATE = new URL('../../../../infra/aws/lake.template.json', import.meta.url)

test('as áreas do servidor são as da receita, divididas entre a cópia e o tratamento', () => {
  const template = JSON.parse(readFileSync(LAKE_TEMPLATE, 'utf8'))
  const namespaces = Object.values<{ Properties: Record<string, unknown> }>(
    template.Resources,
  ).flatMap(({ Properties }) =>
    typeof Properties.Namespace === 'string' ? [Properties.Namespace] : [],
  )
  assert.deepEqual(namespaces.sort(), [...LAKE_AREAS].sort())
  assert.deepEqual([...COPY_AREAS, ...TREAT_AREAS], LAKE_AREAS)
})
