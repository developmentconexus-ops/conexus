import { act, render, screen, waitFor, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { Markdown } from './markdown.tsx'

const ANSWER = [
  '## Resumo do pedido',
  '',
  'Veja a [documentação](https://docs.example.test/guia) e ~~o rascunho~~.',
  '',
  '| Campo | Tipo | Obrigatório |',
  '| --- | :---: | ---: |',
  '| `nome` | texto | sim |',
  '| `valor` | número | não |',
  '',
  '> Confirme os campos antes de publicar.',
  '',
  '- Cadastro',
  '  - Cliente',
  '  - Produto',
  '- Relatório',
  '',
  '- [x] feito',
  '- [ ] a fazer',
  '',
  '```ts',
  'const total = 1 < 2',
  '```',
].join('\n')

test('a tabela, os links, a lista aninhada, a citação e o código viram elementos', () => {
  render(<Markdown text={ANSWER} />)
  const table = screen.getByRole('table')
  expect(within(table).getAllByRole('row')).toHaveLength(3)
  expect(within(table).getAllByRole('columnheader')).toHaveLength(3)
  expect(within(table).getByText('nome').tagName).toBe('CODE')
  expect(within(table).getByRole('cell', { name: 'não' })).toBeTruthy()
  expect(table.parentElement?.className).toContain('overflow-x-auto')

  const link = screen.getByRole('link', { name: /documentação/ })
  expect(link.getAttribute('href')).toBe('https://docs.example.test/guia')
  expect(link.getAttribute('target')).toBe('_blank')
  expect(link.getAttribute('rel')).toBe('noopener noreferrer')

  expect(screen.getByText('o rascunho').tagName).toBe('DEL')
  expect(
    screen.getByText('Confirme os campos antes de publicar.').closest('blockquote'),
  ).toBeTruthy()
  const nested = screen.getByText('Cliente').closest('ul')
  expect(nested?.parentElement?.tagName).toBe('LI')
  expect(screen.getByRole('checkbox', { checked: true })).toBeTruthy()
  expect(screen.getByRole('checkbox', { checked: false })).toBeTruthy()
  expect(screen.getByText('const total = 1 < 2').closest('pre')).toBeTruthy()
})

test('a tabela da conversa do fundador vira tabela, não um parágrafo com barras', () => {
  const { container } = render(
    <Markdown
      text={
        'Veja:\n\n| Nome | Quantidade |\n|------|-----------|\n| Parafuso | 10 |\n| Porca | 4 |\n'
      }
    />,
  )
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(3)
  expect(screen.getByRole('cell', { name: 'Parafuso' })).toBeTruthy()
  expect(container.textContent).not.toContain('|')
})

test('sem HTML do modelo, e só endereços http e https viram link', () => {
  const { container } = render(
    <Markdown
      text={
        '<script>x</script> <b>negrito</b>\n\n[bom](https://a.example.test/x) e [mau](javascript:alert(1))'
      }
    />,
  )
  expect(container.querySelector('script, b')).toBeNull()
  expect(screen.getByRole('link', { name: /bom/ }).getAttribute('href')).toBe(
    'https://a.example.test/x',
  )
  expect(screen.queryByRole('link', { name: /mau/ })).toBeNull()
})

test('chegando aos poucos, a marca e o bloco de código abertos já aparecem formatados', () => {
  const { rerender } = render(<Markdown text="Veja **o pri" streaming />)
  expect(screen.getByText('o pri').tagName).toBe('STRONG')
  rerender(<Markdown text={'Veja:\n```\nconst a = 1'} streaming />)
  expect(screen.getByText('const a = 1').closest('pre')).toBeTruthy()
})

test('um link ainda sem endereço fica texto até o endereço chegar', () => {
  const { rerender } = render(<Markdown text="Veja [o guia](https://docs.exam" streaming />)
  expect(screen.queryByRole('link')).toBeNull()
  rerender(<Markdown text="Veja [o guia](https://docs.example.test/g) agora" streaming />)
  expect(screen.getByRole('link', { name: /o guia/ })).toBeTruthy()
})

test('a tabela chegando aos poucos fecha na última linha e o bloco já assentado não muda', () => {
  const head = '| A | B |\n| - | - |\n| 1 | 2 |\n\n'
  const { container, rerender } = render(<Markdown text={`${head}Depois **bo`} streaming />)
  const table = container.querySelector('table')
  expect(screen.getByText('bo').tagName).toBe('STRONG')
  rerender(<Markdown text={`${head}Depois **bom**.`} streaming />)
  expect(container.querySelector('table')).toBe(table)
})

const MERMAID = 'Veja:\n\n```mermaid\nflowchart TD\n  A --> B\n```'

/** The drawing frame the page keeps, which jsdom does not load: it answers as the frame's script would. */
function frameOf(): HTMLIFrameElement {
  const frame = document.querySelector('iframe')
  if (!frame) throw new Error('no drawing frame')
  return frame
}

function windowOf(frame: HTMLIFrameElement): Window {
  if (!frame.contentWindow) throw new Error('the frame has no window')
  return frame.contentWindow
}

function frameSays(frame: HTMLIFrameElement, data: object) {
  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, source: frame.contentWindow }))
  })
}

test('o bloco mermaid em andamento fica código, e desenha uma vez quando a resposta acaba', async () => {
  const { container, rerender } = render(<Markdown text={MERMAID} streaming />)
  expect(container.querySelector('pre')?.textContent).toContain('flowchart TD')
  expect(document.querySelector('iframe')).toBeNull()
  expect(screen.queryByRole('img', { name: 'Diagrama' })).toBeNull()
  rerender(<Markdown text={MERMAID} />)
  const frame = frameOf()
  expect(frame.getAttribute('sandbox')).toBe('allow-scripts')
  expect(frame.getAttribute('aria-hidden')).toBe('true')
  expect(frame.getAttribute('src')).toBe('/diagram-frame.html')
  const asked = vi.spyOn(windowOf(frame), 'postMessage')
  frameSays(frame, { ready: true })
  await waitFor(() => expect(asked).toHaveBeenCalledTimes(1))
  const [request] = asked.mock.calls[0] ?? []
  expect(Object(request).code).toBe('flowchart TD\n  A --> B')
  frameSays(frame, {
    id: Object(request).id,
    ok: true,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 120 40" style="max-width: 120px;"></svg>',
  })
  const image = await screen.findByRole('img', { name: 'Diagrama' })
  expect(image.getAttribute('src')).toMatch(/^data:image\/svg\+xml/)
  expect(container.querySelector('pre')).toBeNull()
  rerender(<Markdown text={MERMAID} />)
  expect(asked).toHaveBeenCalledTimes(1)
  asked.mockRestore()
})

test('uma mensagem que não vem do quadro não desenha nada', async () => {
  const { container } = render(<Markdown text={MERMAID} />)
  const frame = frameOf()
  const asked = vi.spyOn(windowOf(frame), 'postMessage')
  frameSays(frame, { ready: true })
  await waitFor(() => expect(asked).toHaveBeenCalled())
  const [request] = asked.mock.calls.at(-1) ?? []
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: { id: Object(request).id, ok: true, svg: '<svg viewBox="0 0 120 40"></svg>' },
        source: window,
      }),
    )
  })
  expect(screen.queryByRole('img', { name: 'Diagrama' })).toBeNull()
  expect(container.querySelector('pre')).not.toBeNull()
  asked.mockRestore()
})

test('o mermaid inválido mostra o código e a linha que diz que não foi desenhado', async () => {
  const { container } = render(<Markdown text={MERMAID.replace('A --> B', 'A -->')} />)
  const frame = frameOf()
  const asked = vi.spyOn(windowOf(frame), 'postMessage')
  frameSays(frame, { ready: true })
  await waitFor(() => expect(asked).toHaveBeenCalled())
  const [request] = asked.mock.calls.at(-1) ?? []
  frameSays(frame, { id: Object(request).id, ok: false })
  expect(await screen.findByText('Não foi possível desenhar este diagrama.')).toBeTruthy()
  expect(container.querySelector('pre')?.textContent).toContain('A -->')
  asked.mockRestore()
})
