import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { expect, test, vi } from 'vitest'
import type { PickerGroup, PickerItem, PickerMore, PickerRead } from './picker.tsx'
import { Picker } from './picker.tsx'

type Folder = 'NONE' | 'COMERCIAL' | 'FINANCEIRO' | 'ARQUIVO'

const NONE: PickerItem<Folder> = { value: 'NONE', label: 'Sem Projeto' }
const COMERCIAL: PickerItem<Folder> = { value: 'COMERCIAL', label: 'Comercial' }
const FINANCEIRO: PickerItem<Folder> = { value: 'FINANCEIRO', label: 'Financeiro' }
const ARQUIVO: PickerItem<Folder> = { value: 'ARQUIVO', label: 'Arquivo' }
const GROUPS: PickerGroup<Folder>[] = [
  { label: undefined, items: [NONE] },
  { label: 'Projetos recentes', items: [COMERCIAL, FINANCEIRO] },
]

function Folders(props: {
  groups?: PickerGroup<Folder>[]
  searching?: false
  value?: Folder
  chosen?: PickerItem<Folder>
  more?: PickerMore
  read?: PickerRead
  onText?: (text: string) => void
  onPick?: (value: Folder) => void
}) {
  const [text, setText] = useState('')
  return (
    <Picker
      label="Projeto da conversa"
      trigger={<button type="button" />}
      groups={props.groups ?? GROUPS}
      value={props.value}
      chosen={props.chosen}
      onPick={props.onPick ?? (() => undefined)}
      more={props.more ?? { kind: 'END' }}
      read={props.read ?? { kind: 'READY' }}
      search={
        props.searching === false
          ? undefined
          : {
              text,
              maxLength: 100,
              onText: (next) => {
                props.onText?.(next)
                setText(next)
              },
            }
      }
      searchLabel="Buscar Projeto"
      noMatch="Nenhum Projeto com esse nome."
      empty={<span>Nenhum projeto ainda.</span>}
    />
  )
}

function trigger() {
  return screen.getByRole('combobox', { name: 'Projeto da conversa' })
}

async function open() {
  fireEvent.click(trigger())
  return screen.findByRole('combobox', { name: 'Buscar Projeto' })
}

function type(field: HTMLElement, text: string) {
  fireEvent.change(field, { target: { value: text } })
}

function options() {
  return screen.queryAllByRole('option').map((option) => option.textContent)
}

test('com busca, o campo aparece e o texto sai por onText; os grupos aparecem como vieram, sem filtrar', async () => {
  const onText = vi.fn()
  render(<Folders onText={onText} />)
  const field = await open()
  type(field, 'zzz')
  expect(onText).toHaveBeenLastCalledWith('zzz')
  expect(options()).toEqual(['Sem Projeto', 'Comercial', 'Financeiro'])
  expect(screen.getByText('Projetos recentes')).toBeTruthy()
})

test('o escolhido fora dos grupos segue na lista com o sinal de escolhido', async () => {
  render(<Folders value="ARQUIVO" chosen={ARQUIVO} />)
  await open()
  const chosen = screen.getByRole('option', { name: 'Arquivo' })
  expect(chosen.getAttribute('aria-selected')).toBe('true')
  expect(screen.getByRole('option', { name: 'Comercial' }).getAttribute('aria-selected')).toBe(
    'false',
  )
})

test('com o escolhido e um texto sem resultado, a lista diz noMatch e não mostra o escolhido', async () => {
  render(<Folders value="ARQUIVO" chosen={ARQUIVO} groups={[{ label: undefined, items: [] }]} />)
  const field = await open()
  expect(options()).toEqual(['Arquivo'])
  type(field, 'Vendas')
  expect(await screen.findByText('Nenhum Projeto com esse nome.')).toBeTruthy()
  expect(options()).toEqual([])
})

test('com o escolhido e um texto que acha outros, o escolhido não entra na janela', async () => {
  render(<Folders value="ARQUIVO" chosen={ARQUIVO} />)
  const field = await open()
  expect(options()).toEqual(['Sem Projeto', 'Comercial', 'Financeiro', 'Arquivo'])
  type(field, 'Com')
  expect(options()).toEqual(['Sem Projeto', 'Comercial', 'Financeiro'])
})

test('a busca que chega com a lista aberta só vale na abertura seguinte', async () => {
  const { rerender } = render(<Folders searching={false} />)
  fireEvent.click(trigger())
  await screen.findByRole('listbox')
  rerender(<Folders />)
  expect(screen.getByRole('listbox', { name: 'Projeto da conversa' })).toBeTruthy()
  expect(screen.queryByRole('combobox', { name: 'Buscar Projeto' })).toBeNull()
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  expect(await open()).toBeTruthy()
})

test('o campo de busca leva o limite do texto que o servidor aceita', async () => {
  render(<Folders />)
  expect((await open()).getAttribute('maxlength')).toBe('100')
})

test('sem item e com texto, a lista diz noMatch; sem texto, o vazio do lugar', async () => {
  render(<Folders groups={[{ label: undefined, items: [] }]} />)
  const field = await open()
  expect(await screen.findByText('Nenhum projeto ainda.')).toBeTruthy()
  type(field, 'Vendas')
  expect(await screen.findByText('Nenhum Projeto com esse nome.')).toBeTruthy()
  expect(options()).toEqual([])
})

test('fechar chama onText(vazio): a busca reaberta começa vazia', async () => {
  const onText = vi.fn()
  render(<Folders onText={onText} />)
  const field = await open()
  type(field, 'Com')
  fireEvent.keyDown(field, { key: 'Escape' })
  await waitFor(() => expect(onText).toHaveBeenLastCalledWith(''))
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  const reopened = await open()
  expect(reopened).toHaveProperty('value', '')
})

test('fechar por escolha também chama onText(vazio): reaberta, a busca começa vazia', async () => {
  const onText = vi.fn()
  render(<Folders onText={onText} />)
  type(await open(), 'Fin')
  const option = screen.getByRole('option', { name: 'Financeiro' })
  for (const event of ['pointerDown', 'mouseDown', 'pointerUp', 'mouseUp', 'click'] as const)
    fireEvent[event](option)
  await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
  await waitFor(() => expect(onText).toHaveBeenLastCalledWith(''))
  expect(await open()).toHaveProperty('value', '')
})

test('escolher pelo clique dá o valor do item, e o texto do item não vai a onText', async () => {
  const onText = vi.fn()
  const onPick = vi.fn()
  render(<Folders onText={onText} onPick={onPick} />)
  await open()
  const option = screen.getByRole('option', { name: 'Financeiro' })
  for (const event of ['pointerDown', 'mouseDown', 'pointerUp', 'mouseUp', 'click'] as const)
    fireEvent[event](option)
  expect(onPick).toHaveBeenCalledWith('FINANCEIRO')
  expect(onText).not.toHaveBeenCalledWith('Financeiro')
})

test('sem busca, a peça é o Select: a lista sem campo, com os papéis dele e os mesmos grupos', async () => {
  render(<Folders searching={false} value="COMERCIAL" />)
  fireEvent.click(trigger())
  const list = await screen.findByRole('listbox', { name: 'Projeto da conversa' })
  expect(list).toBeTruthy()
  expect(screen.queryByRole('combobox', { name: 'Buscar Projeto' })).toBeNull()
  expect(screen.queryByRole('textbox')).toBeNull()
  expect(options()).toEqual(['Sem Projeto', 'Comercial', 'Financeiro'])
  expect(screen.getByRole('option', { name: 'Comercial' }).getAttribute('aria-selected')).toBe(
    'true',
  )
  expect(screen.getByRole('group', { name: 'Projetos recentes' })).toBeTruthy()
})

test.each([
  ['com busca', true],
  ['sem busca', false],
] as const)(
  'pelo teclado, %s: abre com a seta, anda, escolhe com Enter, e Esc devolve o foco ao gatilho',
  async (_, searching) => {
    const onPick = vi.fn()
    render(<Folders onPick={onPick} {...(searching ? {} : { searching: false })} />)
    const button = trigger()
    act(() => button.focus())
    fireEvent.keyDown(button, { key: 'ArrowDown' })
    await screen.findByRole('listbox')
    await waitFor(() => expect(document.activeElement).not.toBe(button))
    function at() {
      return searching
        ? screen.getByRole('combobox', { name: 'Buscar Projeto' })
        : (document.activeElement ?? document.body)
    }
    function comercial() {
      return screen.getByRole('option', { name: 'Comercial' })
    }
    for (let step = 0; step < 3 && !comercial().hasAttribute('data-highlighted'); step++) {
      fireEvent.keyDown(at(), { key: 'ArrowDown' })
      await new Promise((settled) => setTimeout(settled, 20))
    }
    expect(comercial().hasAttribute('data-highlighted')).toBe(true)
    fireEvent.keyDown(at(), { key: 'Enter' })
    expect(onPick).toHaveBeenCalledWith('COMERCIAL')
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
    fireEvent.keyDown(button, { key: 'ArrowDown' })
    await screen.findByRole('listbox')
    await waitFor(() => expect(document.activeElement).not.toBe(button))
    fireEvent.keyDown(at(), { key: 'Escape' })
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
    await waitFor(() => expect(document.activeElement).toBe(button))
  },
)

test('Mais Projetos fica desligado enquanto a página vem: o segundo clique não repete o pedido', async () => {
  const onMore = vi.fn()
  function more(loading: boolean): PickerMore {
    return { kind: 'MORE', loading, label: 'Mais Projetos', onMore }
  }
  const { rerender } = render(<Folders more={more(false)} />)
  await open()
  fireEvent.click(screen.getByRole('button', { name: 'Mais Projetos' }))
  expect(onMore).toHaveBeenCalledTimes(1)
  rerender(<Folders more={more(true)} />)
  const button = screen.getByRole('button', { name: 'Mais Projetos' })
  expect(button).toHaveProperty('disabled', true)
  fireEvent.click(button)
  expect(onMore).toHaveBeenCalledTimes(1)
})

test('carregando mostra o esqueleto e nenhum vazio; em falha, a frase do Hub e os itens fixos escolhíveis', async () => {
  const onPick = vi.fn()
  const fixedOnly = [{ label: undefined, items: [NONE] }]
  const { rerender } = render(<Folders groups={[]} read={{ kind: 'LOADING' }} />)
  await open()
  expect(screen.getByRole('listbox', { hidden: true }).closest('[aria-busy=true]')).toBeTruthy()
  expect(screen.queryByText('Nenhum projeto ainda.')).toBeNull()
  rerender(
    <Folders
      groups={fixedOnly}
      onPick={onPick}
      read={{ kind: 'FAILED', sentence: 'Não conseguimos falar com o Hub.' }}
    />,
  )
  expect(screen.getByRole('alert').textContent).toBe('Não conseguimos falar com o Hub.')
  const option = screen.getByRole('option', { name: 'Sem Projeto' })
  for (const event of ['pointerDown', 'mouseDown', 'pointerUp', 'mouseUp', 'click'] as const)
    fireEvent[event](option)
  expect(onPick).toHaveBeenCalledWith('NONE')
})
