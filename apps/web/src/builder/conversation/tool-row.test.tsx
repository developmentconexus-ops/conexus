import type { MessagePart } from '@conexus/hub-api'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { ThinkingLine } from './thinking-line.tsx'
import { ToolRow } from './tool-row.tsx'

type ToolPart = Extract<MessagePart, { type: 'tool' }>

function tool(fields: Partial<ToolPart> & Pick<ToolPart, 'kind'>): ToolPart {
  return { type: 'tool', id: 't', state: 'completed', subject: null, ...fields }
}

function open(name: RegExp) {
  fireEvent.click(screen.getByRole('button', { name }))
}

test('a linha do comando abre no comando e na cauda; cortada, começa com "…"; saída não zero, o código (33)', async () => {
  render(
    <ToolRow
      tool={tool({
        kind: 'run_command',
        subject: { command: 'npm test' },
        detail: {
          kind: 'command',
          command: 'npm test',
          output: ['18 passaram', '1 teste falhou'],
          exitCode: 1,
          cut: true,
        },
      })}
    />,
  )
  expect(screen.queryByText(/1 teste falhou/)).toBeNull()
  open(/Rodou um comando/)
  const block = await screen.findByText(/1 teste falhou/)
  expect(block.textContent).toBe('$ npm test\n…\n18 passaram\n1 teste falhou')
  expect(screen.getByText('O comando terminou com o código 1.')).toBeTruthy()
})

test('um comando que roda está aberto e a saída cresce; o código zero não se diz', () => {
  function running(output: string[]) {
    const detail = {
      kind: 'command',
      command: 'npm i',
      output,
      exitCode: null,
      cut: false,
    } as const
    const subject = { command: 'npm i' }
    return tool({ kind: 'run_command', state: 'running', subject, detail })
  }
  const { rerender } = render(<ToolRow tool={running(['added 1'])} />)
  expect(screen.getByText(/added 1/)).toBeTruthy()
  rerender(<ToolRow tool={running(['added 1', 'added 2'])} />)
  expect(screen.getByText(/added 2/)).toBeTruthy()
  expect(screen.queryByText(/terminou com o código/)).toBeNull()
})

test('a linha do arquivo escrito abre no começo do arquivo, com "…" no corte', async () => {
  render(
    <ToolRow
      tool={tool({
        kind: 'write_file',
        subject: { path: 'src/app.tsx' },
        detail: { kind: 'file', path: 'src/app.tsx', content: 'const a = 1', cut: true },
      })}
    />,
  )
  open(/Escreveu um arquivo/)
  expect((await screen.findByText(/const a = 1/)).textContent).toBe('const a = 1\n…')
})

test('a linha da edição abre na diferença, linha a linha, calculada no navegador', async () => {
  render(
    <ToolRow
      tool={tool({
        kind: 'edit_file',
        subject: { path: 'a.ts' },
        detail: {
          kind: 'edit',
          path: 'a.ts',
          before: 'um\ndois\ntrês',
          after: 'um\nDOIS\ntrês',
          cut: false,
        },
      })}
    />,
  )
  open(/Editou um arquivo/)
  const lines = (await screen.findByText('- dois')).parentElement?.children ?? []
  expect([...lines].map((line) => line.textContent)).toEqual(['  um', '- dois', '+ DOIS', '  três'])
})

test('sem detalhe, a linha não abre: a leitura diz só o assunto; "Pensou" diz só o tempo', () => {
  render(
    <>
      <ToolRow tool={tool({ kind: 'read_file', subject: { path: 'a.ts' } })} />
      <ThinkingLine part={{ type: 'reasoning', id: 'r', state: 'completed', seconds: 9 }} />
    </>,
  )
  expect(screen.getByText('Leu um arquivo')).toBeTruthy()
  expect(screen.getByText('Pensou por 9 s')).toBeTruthy()
  expect(screen.queryByRole('button')).toBeNull()
})
