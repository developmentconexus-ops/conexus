import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fold } from './fold.ts'
import type { ToolItem, TranscriptItem } from './rows.ts'
import { summaryOfTools } from './tool-registry.ts'

function tool(id: string, toolName = 'mastra_workspace_read_file'): ToolItem {
  return {
    kind: 'tool',
    id,
    toolCallId: id,
    toolName,
    state: 'result',
    args: { path: 'a.ts' },
    result: 'content',
  }
}

const textItem: TranscriptItem = { kind: 'text', id: 'text-1', text: 'Pronto.' }
const thoughtItem: TranscriptItem = {
  kind: 'reasoning',
  id: 'r-1',
  reasoning: 'Need file.',
  seconds: 9,
  streaming: false,
}

test('one or two tools in a row stay as individual rows', () => {
  const rows = fold([tool('a'), tool('b')])
  assert.equal(rows.length, 2)
  assert.equal(rows[0]?.kind, 'item')
  assert.equal(rows[1]?.kind, 'item')
})

test('three or more tools in a row fold into one group, in their order', () => {
  const rows = fold([tool('a'), tool('b'), tool('c'), tool('d')])
  assert.equal(rows.length, 1)
  assert.equal(rows[0]?.kind, 'group')
  if (rows[0]?.kind === 'group') {
    assert.deepEqual(
      rows[0].tools.map((t) => t.toolName),
      [
        'mastra_workspace_read_file',
        'mastra_workspace_read_file',
        'mastra_workspace_read_file',
        'mastra_workspace_read_file',
      ],
    )
  }
})

const questionCard: TranscriptItem = {
  kind: 'card',
  cardKind: 'question',
  id: 'q-1',
  toolCallId: 'q-1',
  toolName: 'ask_user',
  state: 'open',
  questions: [],
}
const planCard: TranscriptItem = {
  kind: 'card',
  cardKind: 'plan',
  id: 'p-1',
  toolCallId: 'p-1',
  toolName: 'submit_plan',
  state: 'open',
  title: 'Plano',
  plan: 'Fazer.',
}

test('skill and the cards never group into tool groups (Criterion 9)', () => {
  const rows = fold([
    tool('1', 'mastra_workspace_read_file'),
    tool('2', 'mastra_workspace_read_file'),
    tool('3', 'skill'),
    tool('4', 'mastra_workspace_read_file'),
    tool('5', 'mastra_workspace_read_file'),
  ])
  assert.equal(
    rows.every((row) => row.kind === 'item'),
    true,
  )
  assert.equal(rows.length, 5)

  const askRows = fold([
    tool('1', 'mastra_workspace_read_file'),
    tool('2', 'mastra_workspace_read_file'),
    questionCard,
    tool('4', 'mastra_workspace_read_file'),
  ])
  assert.equal(
    askRows.every((row) => row.kind === 'item'),
    true,
  )

  const planRows = fold([
    tool('1', 'mastra_workspace_read_file'),
    tool('2', 'mastra_workspace_read_file'),
    planCard,
  ])
  assert.equal(
    planRows.every((row) => row.kind === 'item'),
    true,
  )
})

test('a text or a thought ends the run, and each run folds on its own', () => {
  const rows = fold([
    tool('a'),
    tool('b'),
    textItem,
    tool('c'),
    tool('d'),
    tool('e'),
    thoughtItem,
    tool('f'),
  ])
  assert.deepEqual(
    rows.map((row) => row.kind),
    ['item', 'item', 'item', 'group', 'item', 'item'],
  )
})

test('a machine step passes once anything follows it', () => {
  const machine: TranscriptItem = {
    kind: 'conexus',
    id: 'm-1',
    partType: 'data-conexus-machine',
    data: { phase: 'starting' },
  }
  assert.equal(fold([machine]).length, 1)
  const dropped = fold([machine, tool('a')])
  assert.equal(dropped.length, 1)
  assert.equal(dropped[0]?.kind === 'item' && dropped[0].item.kind, 'tool')
})

test('the send step closes the turn, and goes once the Prévia is told', () => {
  const sending: TranscriptItem = {
    kind: 'conexus',
    id: 'm-1',
    partType: 'data-conexus-machine',
    data: { phase: 'sending' },
  }
  const version: TranscriptItem = {
    kind: 'conexus',
    id: 'v-1',
    partType: 'data-conexus-version',
    data: {},
  }
  const preview: TranscriptItem = {
    kind: 'conexus',
    id: 'p-1',
    partType: 'data-conexus-preview',
    data: {},
  }
  function ids(items: TranscriptItem[]) {
    return fold(items).map((row) => (row.kind === 'item' ? row.item.id : 'group'))
  }
  assert.deepEqual(ids([sending, tool('a'), version]), ['a', 'v-1', 'm-1'])
  assert.deepEqual(ids([sending, tool('a'), version, preview]), ['a', 'v-1', 'p-1'])
})

test('the summary counts by tool in order and formats correctly', () => {
  const summary = summaryOfTools([
    tool('1', 'mastra_workspace_list_files'),
    tool('2', 'mastra_workspace_grep'),
    tool('3', 'mastra_workspace_read_file'),
  ])
  assert.equal(summary.short, '3 ferramentas')
  assert.equal(summary.full, '3 ferramentas: listou, procurou, leu')
})
