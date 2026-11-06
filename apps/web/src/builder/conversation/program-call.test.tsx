import { MACHINE_TOOL } from '@conexus/hub-api'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { agentRoom, RoomContext } from './room.ts'
import type { ToolItem } from './rows.ts'
import { ToolRow } from './tool-row.tsx'

const CODE = 'const a = await external_tool_vendas({ mes: "09" })\nreturn a.total'

function programRow(change: Partial<ToolItem>): ToolItem {
  return {
    kind: 'tool',
    id: 't-1',
    toolCallId: 'call-1',
    toolName: MACHINE_TOOL.codeMode,
    state: 'result',
    args: { code: CODE },
    ...change,
  }
}

function drawn(tool: ToolItem) {
  return render(
    <RoomContext.Provider value={agentRoom('Vendas')}>
      <ToolRow tool={tool} />
    </RoomContext.Provider>,
  )
}

test('a chamada Programa: rodando diz "Rodando o programa"; pronta diz "Rodou um programa" e abre o programa e o resultado', () => {
  const running = drawn(programRow({ state: 'call' }))
  expect(screen.getByText('Rodando o programa')).toBeTruthy()
  running.unmount()

  drawn(programRow({ result: { success: true, result: { total: 1234.5 }, logs: [] } }))
  expect(screen.getByText('Rodou um programa')).toBeTruthy()
  expect(screen.queryByText('Rodou um execute typescript')).toBeNull()
  fireEvent.click(screen.getByText('Rodou um programa'))
  expect(screen.getByText('Resultado:')).toBeTruthy()
  expect(screen.getByText(/1234\.5/)).toBeTruthy()
})

test('a chamada Programa aberta mostra só o resultado: nem o código, nem o envelope do Mastra; os registros só quando há', () => {
  const quiet = drawn(
    programRow({ result: { success: true, result: { total: 1234.5 }, logs: [] } }),
  )
  fireEvent.click(screen.getByText('Rodou um programa'))
  expect(screen.queryByText(/external_tool_vendas/)).toBeNull()
  expect(screen.queryByText('Argumentos:')).toBeNull()
  expect(screen.queryByText(/success/)).toBeNull()
  expect(screen.queryByText(/logs/)).toBeNull()
  expect(screen.queryByText('Registros:')).toBeNull()
  quiet.unmount()

  drawn(programRow({ result: { success: true, result: 7, logs: ['lidas 251 linhas'] } }))
  fireEvent.click(screen.getByText('Rodou um programa'))
  expect(screen.getByText('Registros:')).toBeTruthy()
  expect(screen.getByText('lidas 251 linhas')).toBeTruthy()
})

test('um programa que falha mostra o erro dele, sem abrir o resultado; passar do tempo diz "O programa passou do tempo"', () => {
  const failed = drawn(
    programRow({
      result: {
        success: false,
        logs: [],
        error: { name: 'ReferenceError', message: 'total is not defined\n    at line 3', line: 3 },
      },
    }),
  )
  expect(screen.getByText('O programa falhou: total is not defined')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /O programa falhou/ })).toBeNull()
  fireEvent.click(screen.getByText('O programa falhou: total is not defined'))
  expect(screen.queryByText('Resultado:')).toBeNull()
  failed.unmount()

  drawn(
    programRow({
      result: {
        success: false,
        logs: [],
        error: { name: 'TimeoutError', message: 'Code Mode execution timed out after 30000ms' },
      },
    }),
  )
  expect(screen.getByText('O programa passou do tempo')).toBeTruthy()
  expect(screen.queryByText(/30000ms/)).toBeNull()
})
