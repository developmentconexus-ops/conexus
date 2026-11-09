import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BalloonId } from '@conexus/hub-api'
import { mastraWorkflowIdOf, parseMastraWorkflowId, pathOf } from './public.ts'
import { frozenOf, ifBalloon, notify, use, WORKFLOW_A, WORKFLOW_B } from './test-workflows.ts'

/** One segment of a path: the balloon that holds it and the index of the path in it. */
function step(balloon: string, index: number) {
  return { balloon: BalloonId.parse(balloon), index }
}

test('a id do Mastra: cada forma volta de texto a id, e o que não é nosso não é lido', () => {
  const version = { kind: 'VERSION', workflowId: WORKFLOW_A, version: 3, path: [] } as const
  const nested = { ...version, path: [step('b4', 1), step('b7', 0)] } as const
  const test = { kind: 'TEST', workflowId: WORKFLOW_A, path: [] } as const
  for (const id of [version, nested, test]) {
    assert.deepEqual(parseMastraWorkflowId(mastraWorkflowIdOf(id)), id)
  }
  assert.equal(mastraWorkflowIdOf(nested), `wf-${WORKFLOW_A}-v3-b4_1-b7_0`)
  assert.equal(parseMastraWorkflowId('conexus-automation-run'), null)
  assert.equal(parseMastraWorkflowId(`wf-${WORKFLOW_A}-vx`), null)
})

test('o caminho no frozen: o "senão", o outro workflow de um USE, e nenhum onde o desenho não tem', () => {
  const other = frozenOf([notify(1, 'de dentro')])
  const frozen = frozenOf(
    [ifBalloon(1, 'x', [notify(2, 'sim')], [notify(3, 'não')]), use(4, WORKFLOW_B)],
    {
      uses: [
        {
          balloonId: BalloonId.parse('b4'),
          workflowId: WORKFLOW_B,
          versionNumber: 1,
          frozen: other,
        },
      ],
    },
  )
  assert.equal(pathOf(frozen, [])?.balloon, null)
  assert.deepEqual(
    pathOf(frozen, [step('b1', 1)])?.list.map((each) => each.id),
    ['b3'],
  )
  assert.equal(pathOf(frozen, [step('b4', 0)])?.frozen, other)
  assert.equal(pathOf(frozen, [step('b1', 2)]), null)
  assert.equal(pathOf(frozen, [step('b9', 0)]), null)
})
