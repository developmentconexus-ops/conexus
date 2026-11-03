import type { OfferedConnection, ToolInput, ToolVersionConfig } from '@conexus/hub-api'
import {
  OperationId,
  ToolInput as ToolInputSchema,
  ToolVersionConfig as VersionSchema,
} from '@conexus/hub-api'
import { useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { Field, FieldError, FieldLabel } from '../../ui/field.tsx'
import { Input } from '../../ui/input.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx'
import { Textarea } from '../../ui/textarea.tsx'
import { reasonText } from './text.ts'

type Refusal = { field: string | undefined; reason: string | undefined }
type Local = { field: string; text: string }

/** The fixed values the person typed, read as the contract reads them; what is not JSON says so. */
function boundOf(text: string) {
  try {
    return VersionSchema.shape.bound.safeParse(JSON.parse(text))
  } catch (cause) {
    return { success: false as const, syntax: cause instanceof SyntaxError ? cause.message : text }
  }
}

type Typed = {
  connectionId: string | undefined
  operation: string | undefined
  slug: string
  description: string
  bound: string
  open: string
}

/** What the person typed, as the contract reads it: the tool, or the field to fix and why. */
function inputOf(typed: Typed): { input?: ToolInput; local?: Local } {
  const values = boundOf(typed.bound)
  if (!values.success) {
    const syntax = 'syntax' in values ? `: ${values.syntax}` : '.'
    return {
      local: { field: 'bound', text: `Os valores fixos não são um JSON de campos${syntax}` },
    }
  }
  const parsed = ToolInputSchema.safeParse({
    ...typed,
    bound: values.data,
    open: typed.open
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name !== ''),
  })
  if (parsed.success) return { input: parsed.data }
  return {
    local: { field: String(parsed.error.issues[0]?.path[0] ?? ''), text: 'Confira este campo.' },
  }
}

function Where(props: {
  offered: readonly OfferedConnection[]
  connectionId: string | undefined
  operation: string | undefined
  slug: string
  onConnection: (id: string) => void
  onOperation: (operation: string) => void
  onSlug: (slug: string) => void
  say: (field: string) => string | undefined
}) {
  const reads = props.offered.find((one) => one.connectionId === props.connectionId)?.reads ?? []
  return (
    <>
      <Field>
        <FieldLabel htmlFor="tool-connection">Ligação</FieldLabel>
        <Select
          value={props.connectionId}
          items={props.offered.map((one) => ({ value: one.connectionId, label: one.name }))}
          onValueChange={(next) => next !== null && props.onConnection(next)}
        >
          <SelectTrigger id="tool-connection">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {props.offered.map((one) => (
              <SelectItem key={one.connectionId} value={one.connectionId}>
                {one.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError>{props.say('connectionId')}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="tool-operation">Leitura</FieldLabel>
        <Select
          value={props.operation}
          items={reads.map((read) => ({ value: read.operation, label: read.label }))}
          onValueChange={(next) => next !== null && props.onOperation(next)}
        >
          <SelectTrigger id="tool-operation">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reads.map((read) => (
              <SelectItem key={read.operation} value={read.operation}>
                {read.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldError>{props.say('operation')}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="tool-slug">Nome da ferramenta</FieldLabel>
        <Input
          id="tool-slug"
          value={props.slug}
          onChange={(event) => props.onSlug(event.target.value)}
        />
        <FieldError>{props.say('slug')}</FieldError>
      </Field>
    </>
  )
}

function Values(props: {
  description: string
  bound: string
  open: string
  say: (field: string) => string | undefined
  onDescription: (text: string) => void
  onBound: (text: string) => void
  onOpen: (text: string) => void
}) {
  return (
    <>
      <Field>
        <FieldLabel htmlFor="tool-description">O que ela faz</FieldLabel>
        <Textarea
          id="tool-description"
          value={props.description}
          onChange={(event) => props.onDescription(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="tool-bound">Valores fixos (JSON)</FieldLabel>
        <Textarea
          id="tool-bound"
          value={props.bound}
          onChange={(event) => props.onBound(event.target.value)}
        />
        <FieldError>{props.say('bound')}</FieldError>
      </Field>
      <Field>
        <FieldLabel htmlFor="tool-open">
          Campos que o modelo preenche (separados por vírgula)
        </FieldLabel>
        <Input
          id="tool-open"
          value={props.open}
          onChange={(event) => props.onOpen(event.target.value)}
        />
        <FieldError>{props.say('open')}</FieldError>
      </Field>
    </>
  )
}

/**
 * The form of a tool of the library (step 24.3, U5; U7 uses it for the next version): one read of a
 * connection the Projeto offers, the values it fixes and the fields the model fills. `fixed` is an
 * existing tool, whose connection and read do not change. What the Hub refuses (`TOOL_REFUSED`) is
 * said beside the field it names.
 */
export function ToolForm(props: {
  offered: readonly OfferedConnection[]
  fixed?: Pick<ToolInput, 'connectionId' | 'operation' | 'slug'>
  initial?: ToolVersionConfig
  pending: boolean
  refused: Refusal | undefined
  error: string | undefined
  submitLabel: string
  onSubmit: (input: ToolInput) => void
  onCancel: () => void
}) {
  const { fixed, initial, refused } = props
  const first = props.offered[0]
  const [connectionId, setConnectionId] = useState<string | undefined>(
    fixed?.connectionId ?? first?.connectionId,
  )
  const [operation, setOperation] = useState<string | undefined>(
    fixed?.operation ?? first?.reads[0]?.operation,
  )
  const [slug, setSlug] = useState(fixed?.slug ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [bound, setBound] = useState(JSON.stringify(initial?.bound ?? {}, null, 2))
  const [open, setOpen] = useState((initial?.open ?? []).join(', '))
  const [local, setLocal] = useState<Local>()

  function say(field: string): string | undefined {
    if (local?.field === field) return local.text
    return refused?.field === field ? (reasonText(refused.reason) ?? 'Recusado.') : undefined
  }

  function submit() {
    const made = inputOf({ connectionId, operation, slug, description, bound, open })
    setLocal(made.local)
    if (made.input !== undefined) props.onSubmit(made.input)
  }

  return (
    <form
      className="flex flex-col gap-md"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      {fixed === undefined && (
        <Where
          offered={props.offered}
          connectionId={connectionId}
          operation={operation}
          slug={slug}
          say={say}
          onSlug={setSlug}
          onOperation={(next) => setOperation(OperationId.parse(next))}
          onConnection={(next) => {
            const found = props.offered.find((one) => one.connectionId === next)
            setConnectionId(found?.connectionId)
            setOperation(found?.reads[0]?.operation)
          }}
        />
      )}
      <Values
        description={description}
        bound={bound}
        open={open}
        say={say}
        onDescription={setDescription}
        onBound={setBound}
        onOpen={setOpen}
      />
      {props.error !== undefined && (
        <p role="alert" className="text-danger">
          {props.error}
        </p>
      )}
      <div className="flex flex-wrap gap-md">
        <Button
          type="submit"
          variant="primary"
          disabled={props.pending || connectionId === undefined}
        >
          {props.pending ? 'Gravando…' : props.submitLabel}
        </Button>
        <Button type="button" variant="ghost" disabled={props.pending} onClick={props.onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
