import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { MessagePart } from '@conexus/hub-api'
import type { ToolPart } from './fold.ts'
import { fold } from './fold.ts'
import { summaryOf } from './tool-text.ts'

function tool(
  id: string,
  kind: ToolPart['kind'] = 'read_page',
  state: ToolPart['state'] = 'completed',
): ToolPart {
  return { type: 'tool', id, kind, state, subject: null }
}

const text: MessagePart = { type: 'text', text: 'Pronto.' }
const thought: MessagePart = { type: 'reasoning', id: 'r', state: 'completed', seconds: 9 }

test('one or two tools in a row stay as rows', () => {
  assert.deepEqual(
    fold([tool('a'), tool('b')]).map((row) => row.kind),
    ['part', 'part'],
  )
})

test('three or more tools in a row fold into one group, in their order', () => {
  const rows = fold([tool('a'), tool('b'), tool('c'), tool('d')])
  assert.deepEqual(rows, [{ kind: 'group', tools: [tool('a'), tool('b'), tool('c'), tool('d')] }])
})

test('a text or a thought ends the run, and each run folds on its own', () => {
  const rows = fold([
    tool('a'),
    tool('b'),
    text,
    tool('c'),
    tool('d'),
    tool('e'),
    thought,
    tool('f'),
  ])
  assert.deepEqual(
    rows.map((row) => row.kind),
    ['part', 'part', 'part', 'group', 'part', 'part'],
  )
})

test('a notice and a failure end a run too, and nothing is lost or reordered', () => {
  const parts: MessagePart[] = [
    tool('a'),
    tool('b'),
    { type: 'notice', text: 'aviso' },
    tool('c'),
    tool('d'),
    { type: 'failure', code: 'MODEL_CALL_FAILED' },
  ]
  const flat = fold(parts).flatMap((row) => (row.kind === 'group' ? row.tools : [row.part]))
  assert.deepEqual(flat, parts)
  assert.equal(
    fold(parts).some((row) => row.kind === 'group'),
    false,
  )
})

test('the summary counts by kind in the order the kinds first appear, with the failures named', () => {
  const tools = [
    tool('a'),
    tool('b', 'search_web'),
    tool('c'),
    tool('d'),
    tool('e', 'other', 'error'),
  ]
  assert.equal(summaryOf(tools), 'Leu 3 páginas, pesquisou 1 vez, usou 1 ferramenta · 1 falhou')
  assert.equal(summaryOf([tool('a'), tool('b'), tool('c')]), 'Leu 3 páginas')
})
