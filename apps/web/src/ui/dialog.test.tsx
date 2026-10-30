import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Dialog, DialogContent } from './dialog.tsx'

function popup(size: 'form' | 'fields' | 'ask') {
  render(
    <Dialog open>
      <DialogContent title="Janela" size={size}>
        <p>corpo</p>
      </DialogContent>
    </Dialog>,
  )
  return screen.getByRole('dialog').classList
}

test('`fields` ocupa a tela abaixo de sm e a largura wide acima', () => {
  const classes = popup('fields')
  expect(classes.contains('inset-0')).toBe(true)
  expect(classes.contains('sm:max-w-wide')).toBe(true)
})

test('`ask` tem a largura wide acima de sm e abaixo dele é um cartão que abraça o corpo, nunca a tela inteira', () => {
  const classes = popup('ask')
  expect(classes.contains('sm:max-w-wide')).toBe(true)
  expect(classes.contains('sm:w-[calc(100%-4rem)]')).toBe(true)
  expect(classes.contains('inset-0')).toBe(false)
  expect(classes.contains('top-1/2')).toBe(true)
  expect(classes.contains('w-[calc(100%-2rem)]')).toBe(true)
})
