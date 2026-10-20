import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
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
