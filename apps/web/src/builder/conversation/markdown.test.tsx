import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Markdown } from './markdown.tsx'

test('listas, código e marcas viram elementos, sem HTML do modelo', () => {
  const { container } = render(
    <Markdown
      text={
        '## Opções\n\n- um `app`\n- **dois**\n\n1. primeiro\n\n```\nlinha <b>x</b>\n```\n\n<script>x</script>'
      }
    />,
  )
  expect(screen.getByText('Opções')).toBeTruthy()
  expect(screen.getAllByRole('listitem')).toHaveLength(3)
  expect(screen.getByText('app').tagName).toBe('CODE')
  expect(screen.getByText('dois').tagName).toBe('STRONG')
  expect(screen.getByText('linha <b>x</b>').tagName).toBe('PRE')
  expect(screen.getByText('<script>x</script>')).toBeTruthy()
  expect(container.querySelector('script, b')).toBeNull()
})

test('chegando aos poucos, a marca e o bloco de código abertos já aparecem formatados', () => {
  const { rerender } = render(<Markdown text="Veja **o pri" streaming />)
  expect(screen.getByText('o pri').tagName).toBe('STRONG')
  rerender(<Markdown text={'Veja:\n```\nconst a = 1'} streaming />)
  expect(screen.getByText('const a = 1').tagName).toBe('PRE')
})

test('só endereços http e https viram link', () => {
  render(<Markdown text="[bom](https://a.example.test/x) e [mau](javascript:alert(1))" />)
  expect(screen.getByRole('link', { name: /bom/ }).getAttribute('href')).toBe(
    'https://a.example.test/x',
  )
  expect(screen.queryByRole('link', { name: /mau/ })).toBeNull()
})
