import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fold } from './fold.ts'
import { summaryOfTools } from './tool-presentation.ts'
import type { ToolItem, TranscriptItem } from './transcript.ts'

function tool(id: string, toolName = 'read_file'): ToolItem {
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
      ['read_file', 'read_file', 'read_file', 'read_file'],
    )
  }
})

test('skill, ask_user and submit_plan never group into tool groups (Criterion 9)', () => {
  const rows = fold([
    tool('1', 'read_file'),
    tool('2', 'read_file'),
    tool('3', 'skill'),
    tool('4', 'read_file'),
    tool('5', 'read_file'),
  ])
  assert.equal(
    rows.every((row) => row.kind === 'item'),
    true,
  )
  assert.equal(rows.length, 5)

  const askRows = fold([
    tool('1', 'read_file'),
    tool('2', 'read_file'),
    tool('3', 'ask_user'),
    tool('4', 'read_file'),
  ])
  assert.equal(
    askRows.every((row) => row.kind === 'item'),
    true,
  )

  const planRows = fold([tool('1', 'read_file'), tool('2', 'read_file'), tool('3', 'submit_plan')])
  assert.equal(
    planRows.every((row) => row.kind === 'item'),
    true,
  )
})

test('task_* tools have no line in fold', () => {
  const rows = fold([
    tool('1', 'task_write'),
    tool('2', 'task_update'),
    tool('3', 'task_complete'),
    tool('4', 'task_check'),
  ])
  assert.equal(rows.length, 0)
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

test('ephemeral machine steps pass while replaced machine phase lasts', () => {
  const ephemeralMachine: TranscriptItem = {
    kind: 'conexus',
    id: 'm-1',
    partType: 'data-conexus-machine',
    data: { phase: 'starting' },
  }
  const replacedMachine: TranscriptItem = {
    kind: 'conexus',
    id: 'm-2',
    partType: 'data-conexus-machine',
    data: { phase: 'replaced' },
  }

  // Ephemeral followed by tool: ephemeral is dropped
  const dropped = fold([ephemeralMachine, tool('a')])
  assert.equal(dropped.length, 1)
  assert.equal(dropped[0]?.kind, 'item')
  if (dropped[0]?.kind === 'item') {
    assert.equal(dropped[0].item.kind, 'tool')
  }

  // Replaced followed by tool: replaced lasts
  const kept = fold([replacedMachine, tool('a')])
  assert.equal(kept.length, 2)
  assert.equal(kept[0]?.kind, 'item')
  if (kept[0]?.kind === 'item') {
    assert.equal(kept[0].item.kind, 'conexus')
  }
})

test('the summary counts by tool in order and formats correctly', () => {
  const summary = summaryOfTools([
    { toolName: 'list_files' },
    { toolName: 'grep' },
    { toolName: 'read_file' },
  ])
  assert.equal(summary.short, '3 ferramentas')
  assert.equal(summary.full, '3 ferramentas: listou, procurou, leu')
})
