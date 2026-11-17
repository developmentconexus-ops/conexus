import { PlusIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Button } from '../button.tsx'
import { Checkbox } from '../checkbox.tsx'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from '../combobox.tsx'
import { Field, FieldError, FieldGroup, FieldLabel } from '../field.tsx'
import { Form, FormAlert, TextField, useSchemaForm } from '../form.tsx'
import { Input } from '../input.tsx'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '../input-group.tsx'
import { Label } from '../label.tsx'
import type { PickerMore, PickerRead } from '../picker.tsx'
import { matches, Picker, SEARCH_FROM } from '../picker.tsx'
import { SearchField } from '../search-field.tsx'
import { ChoiceSelect } from '../select.tsx'
import { Slider } from '../slider.tsx'
import { Switch } from '../switch.tsx'
import { Textarea } from '../textarea.tsx'

import { entry, FOCUS, HOVER, noop } from './kit.tsx'
import type { ShowcaseEntry } from './types.ts'

function NameForm({ invalid }: { invalid?: true }) {
  const form = useSchemaForm(z.object({ nome: z.string().min(1, 'Escreva o nome.') }), { nome: '' })
  useEffect(() => {
    if (invalid) void form.trigger()
  }, [form, invalid])
  return (
    <Form form={form} onSubmit={async () => undefined}>
      <TextField name="nome" label="Nome" type="text" autoComplete="name" />
      <FormAlert />
    </Form>
  )
}

function Searching() {
  const [query, setQuery] = useState('')
  return <SearchField label="Buscar tabela" value={query} onChange={setQuery} />
}

function Models({ empty }: { empty?: true }) {
  return (
    <Combobox items={empty ? [] : MODELS}>
      <ComboboxValue />
      <ComboboxInput aria-label="Modelo" />
      <ComboboxContent>
        <ComboboxEmpty>Nenhum modelo</ComboboxEmpty>
        <ComboboxList>
          {(model: string) => (
            <ComboboxItem key={model} value={model}>
              {model}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

const MODELS = ['Claude Sonnet 4.5', 'Claude Opus 4.5', 'GPT-5']

const FOLDERS = ['Comercial', 'Financeiro', 'Estoque', 'Compras', 'Logística', 'Fiscal', 'RH']
const END: PickerMore = { kind: 'END' }

const NONE = [{ value: 'NONE', label: 'Sem Projeto' }]

function Folders(props: {
  names: readonly string[]
  read: PickerRead
  more?: PickerMore
  bare?: true
}) {
  const [value, setValue] = useState<string | undefined>(props.names[0])
  const [text, setText] = useState('')
  const items = props.names.map((name) => ({ value: name, label: name }))
  const fixed = props.bare ? [] : NONE
  return (
    <Picker
      label="Projeto"
      trigger={<Button>{value ?? 'Projeto'}</Button>}
      groups={[
        { label: undefined, items: fixed.filter((item) => matches(item.label, text)) },
        { label: undefined, items: items.filter((item) => matches(item.label, text)) },
      ]}
      value={value}
      chosen={items.find((item) => item.value === value)}
      onPick={setValue}
      more={props.more ?? END}
      read={props.read}
      search={items.length + fixed.length >= SEARCH_FROM ? { text, onText: setText } : undefined}
      searchLabel="Buscar Projeto"
      noMatch="Nenhum Projeto com esse nome."
      empty={<span>Nenhum projeto ainda.</span>}
    />
  )
}

function Choose({ disabled }: { disabled?: true }) {
  const [value, setValue] = useState('a')
  const items = [
    { value: 'a', label: 'Toda a empresa' },
    { value: 'b', label: 'Só o Comercial' },
  ]
  return (
    <ChoiceSelect
      label="Quem vê"
      value={value}
      items={items}
      onValueChange={(next) => setValue(next ?? 'a')}
      disabled={disabled}
    />
  )
}

export const FIELDS: readonly ShowcaseEntry[] = [
  entry(
    'input.tsx',
    'Campos',
    'Um texto curto de uma linha.',
    () => <Input aria-label="Campo" placeholder="Nome do cliente" />,
    [
      ['hover', () => <Input aria-label="Campo" placeholder="Nome do cliente" {...HOVER} />],
      ['focus', () => <Input aria-label="Campo" placeholder="Nome do cliente" {...FOCUS} />],
      ['disabled', () => <Input aria-label="Campo" placeholder="Nome do cliente" disabled />],
      ['invalid', () => <Input aria-label="Campo" defaultValue="maria@" aria-invalid />],
    ],
  ),
  entry(
    'textarea.tsx',
    'Campos',
    'Um texto longo, que cresce com o que se escreve.',
    () => <Textarea aria-label="Observação" placeholder="Conte o que o app deve fazer" />,
    [
      ['disabled', () => <Textarea aria-label="Observação" disabled />],
      ['invalid', () => <Textarea aria-label="Observação" aria-invalid defaultValue="…" />],
    ],
  ),
  entry(
    'checkbox.tsx',
    'Campos',
    'Marcar uma opção que vale sozinha.',
    () => <Checkbox aria-label="Receber avisos" defaultChecked />,
    [
      ['default', () => <Checkbox aria-label="Receber avisos" />],
      ['disabled', () => <Checkbox aria-label="Receber avisos" disabled />],
    ],
  ),
  entry(
    'switch.tsx',
    'Campos',
    'Ligar ou desligar algo que vale na hora.',
    () => <Switch aria-label="Avisos" defaultChecked />,
    [
      ['default', () => <Switch aria-label="Avisos" />],
      ['disabled', () => <Switch aria-label="Avisos" disabled />],
    ],
  ),
  entry(
    'slider.tsx',
    'Campos',
    'Escolher um nível numa escala curta.',
    () => <Slider label="Raciocínio" min={0} max={4} step={1} defaultValue={3} />,
    [['disabled', () => <Slider label="Raciocínio" min={0} max={4} defaultValue={1} disabled />]],
  ),
  entry('label.tsx', 'Campos', 'O nome de um campo, sempre ligado a ele.', () => (
    <div className="flex flex-col gap-xs">
      <Label htmlFor="showcase-label">E-mail</Label>
      <Input id="showcase-label" />
    </div>
  )),
  entry(
    'field.tsx',
    'Campos',
    'Nome, campo e erro de uma pergunta, juntos.',
    () => (
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="showcase-field">Nome</FieldLabel>
          <Input id="showcase-field" />
        </Field>
      </FieldGroup>
    ),
    [
      [
        'invalid',
        () => (
          <Field data-invalid>
            <FieldLabel htmlFor="showcase-bad">Nome</FieldLabel>
            <Input id="showcase-bad" aria-invalid />
            <FieldError>Escreva o nome.</FieldError>
          </Field>
        ),
      ],
    ],
  ),
  entry(
    'form.tsx',
    'Campos',
    'Um formulário que valida antes de enviar e traz a frase do Hub.',
    () => <NameForm />,
    [['invalid', () => <NameForm invalid />]],
  ),
  entry('input-group.tsx', 'Campos', 'Um campo com botão ou texto colado nele.', () => (
    <InputGroup>
      <InputGroupTextarea aria-label="Mensagem" placeholder="Escreva uma mensagem" />
      <InputGroupAddon align="block-end">
        <InputGroupButton aria-label="Enviar">
          <PlusIcon aria-hidden="true" />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )),
  entry('select.tsx', 'Campos', 'Escolher uma entre poucas opções, sem busca.', () => <Choose />, [
    ['disabled', () => <Choose disabled />],
  ]),
  entry(
    'picker.tsx',
    'Campos',
    'Escolher um item de uma lista que pode ser longa, buscada no Hub a partir de 7 linhas.',
    () => (
      <Folders
        names={FOLDERS}
        read={{ kind: 'READY' }}
        more={{ kind: 'MORE', loading: false, label: 'Mais Projetos', onMore: noop }}
      />
    ),
    [
      ['empty', () => <Folders names={[]} read={{ kind: 'READY' }} bare />],
      ['loading', () => <Folders names={[]} read={{ kind: 'LOADING' }} />],
      [
        'error',
        () => (
          <Folders
            names={[]}
            read={{ kind: 'FAILED', sentence: 'Não conseguimos falar com o Hub. Tente de novo.' }}
          />
        ),
      ],
    ],
  ),
  entry('combobox.tsx', 'Campos', 'Escolher numa lista que se busca digitando.', () => <Models />, [
    ['empty', () => <Models empty />],
  ]),
  entry('search-field.tsx', 'Campos', 'Filtrar uma lista que já está na tela.', () => (
    <Searching />
  )),
]
