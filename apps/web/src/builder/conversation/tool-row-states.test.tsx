import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { ToolItem } from './rows.ts'
import { invocationToItem } from './rows.ts'
import type { Invocation } from './tool-fixtures.ts'
import { ToolRow } from './tool-row.tsx'

function itemOf(inv: Invocation): ToolItem {
  const item = invocationToItem(inv, undefined)
  if (item?.kind !== 'tool') throw new Error(`${inv.toolName} is not a row`)
  return item
}

function open(name: RegExp) {
  fireEvent.click(screen.getByRole('button', { name }))
}

const READS = [
  ['ler uma skill', { skill: 'conexus-build' }, 'mastra_skill'],
  ['ler o arquivo do plano', { path: '.conexus/plans/plano.md' }, 'mastra_workspace_read_file'],
  ['uma ferramenta do workspace', { path: 'src/a.ts' }, 'mastra_workspace_file_stat'],
] as const

test.each(READS)(
  'a linha: %s nasce fechada, ao vivo e relida, e abre no clique (8)',
  (_, args, toolName) => {
    const done: Invocation = {
      state: 'result',
      toolCallId: 'toolu_r1',
      toolName,
      args,
      result: 'ok',
    }
    const live = render(<ToolRow tool={itemOf({ ...done, state: 'call', result: undefined })} />)
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
    live.rerender(<ToolRow tool={itemOf(done)} />)
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
    live.unmount()
    render(<ToolRow tool={itemOf(done)} />)
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true')
  },
)

test('o comando que ainda diz sua saída segue fechado, e só o clique da pessoa abre (8)', () => {
  const command: ToolItem = {
    kind: 'tool',
    id: 't-9',
    toolCallId: 'call-9',
    toolName: 'mastra_workspace_execute_command',
    state: 'call',
    args: { command: 'echo começo' },
    output: 'começo\n',
  }
  const view = render(<ToolRow tool={command} />)
  expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false')
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true')
  view.rerender(<ToolRow tool={{ ...command, state: 'result', result: 'começo\n' }} />)
  expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('true')
})

test.each([
  ['app_data_check', { kind: 'REFUSED', code: 'APP_DATA_REFUSED', sqlstate: '42601' }],
  ['app_data_read', { kind: 'REFUSED', code: 'APP_DATA_REFUSED', sqlstate: '42P01' }],
  ['app_data_check', { kind: 'FAILED', code: 'APP_DATA_TIMEOUT' }],
])('%s que falhou abre nos argumentos e na recusa, com o SQLSTATE (9)', (toolName, result) => {
  const tool: ToolItem = {
    kind: 'tool',
    id: 't-9',
    toolCallId: 'call-9',
    toolName,
    state: 'result',
    args: { sql: 'select * from nao_existe' },
    result,
  }
  render(<ToolRow tool={tool} />)
  open(/Não conseguiu/)
  expect(screen.getByText(/select \* from nao_existe/)).toBeTruthy()
  const detail = 'sqlstate' in result ? result.sqlstate : result.code
  expect(screen.getByText(new RegExp(detail))).toBeTruthy()
})

test.each([
  [{ kind: 'EXISTS', name: 'vendas', releasedHere: false }, /peça na página Cópias/],
  [{ kind: 'EXISTS', name: 'vendas', releasedHere: true }, /já está liberada a este Projeto/],
  [{ kind: 'NOT_IN_ROLE', role: 'developer', operation: 'Consulta' }, /leitura Consulta/],
  [{ kind: 'MALFORMED', issues: ['name: Too long'] }, /name: Too long/],
])('copy_propose recusada diz o motivo na linha, não só em JSON (19)', (result, said) => {
  const tool: ToolItem = {
    kind: 'tool',
    id: 't-19',
    toolCallId: 'call-19',
    toolName: 'copy_propose',
    state: 'result',
    args: { name: 'vendas' },
    result,
  }
  render(<ToolRow tool={tool} />)
  expect(screen.getByText(said)).toBeTruthy()
  expect(screen.getByText('Não conseguiu propor a cópia')).toBeTruthy()
  open(/Não conseguiu propor a cópia/)
  expect(screen.getByText('Argumentos:')).toBeTruthy()
})
