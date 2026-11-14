import type {
  CodeView,
  CompanyId,
  ConceptPage,
  ConceptRow,
  FieldView,
  RelationView,
} from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { sentenceOf } from '../../platform/hub.ts'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { PageTitle, SectionTitle } from '../../ui/list.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import { connectionsQuery } from '../connectors/public.ts'
import { FlowPlace } from './concepts.tsx'
import { conceptQuery, ontologyQuery } from './queries.ts'
import { SuggestForm } from './suggest.tsx'
import {
  BACK_TO_CONCEPT,
  CODE_GONE,
  fieldTypeText,
  plural,
  SEE_AND_SUGGEST,
  SUGGEST,
  when,
} from './text.ts'
import { Waiting } from './waiting.tsx'

type Names = readonly ConceptRow[]

function nameOf(names: Names, key: string): string {
  return names.find((each) => each.key === key)?.name ?? key
}

function ConceptLink(props: { companyId: CompanyId; concept: string; names: Names }) {
  return (
    <Link
      to="/companies/$companyId/knowledge/$concept"
      params={{ companyId: props.companyId, concept: props.concept }}
      className="underline"
    >
      {nameOf(props.names, props.concept)}
    </Link>
  )
}

/** The top of a concept that left or leans on another: who replaced it, or which concept it is a role of. */
function Standing(props: { companyId: CompanyId; page: ConceptPage; names: Names }) {
  const { concept } = props.page
  const { companyId, names } = props
  if (concept.state === 'DEPRECATED')
    return (
      <p className="text-text-2">
        {'Aposentado'}
        {concept.replacedBy !== null && (
          <>
            {': use '}
            <ConceptLink companyId={companyId} concept={concept.replacedBy} names={names} />
          </>
        )}
        {'.'}
      </p>
    )
  if (concept.base === null) return null
  return (
    <p className="text-text-2">
      {'Papel de '}
      <ConceptLink companyId={companyId} concept={concept.base} names={names} />
    </p>
  )
}

function nameOfField(fields: readonly FieldView[], key: string): string {
  return fields.find((each) => each.key === key)?.name ?? key
}

function Facts({ page }: { page: ConceptPage }) {
  const { concept, fields } = page
  const also = concept.synonyms.length === 0 ? '' : `Também: ${concept.synonyms.join(', ')} · `
  return (
    <p className="break-words text-text-2">
      {`${also}chave: ${concept.keyFields.map((key) => nameOfField(fields, key)).join(', ')} · mostra: ${nameOfField(fields, concept.titleField)}`}
    </p>
  )
}

function SourceBlock({ companyId, page }: { companyId: CompanyId; page: ConceptPage }) {
  const connections = useQuery(connectionsQuery(companyId))
  const { source } = page
  if (source === null) return null
  const name = connections.data?.connections.find((each) => each.id === source.connectionId)?.name
  return (
    <div className="flex flex-col gap-xs">
      <p className="break-words">
        <span className="text-text-2">Lido de </span>
        {name ?? '—'}
      </p>
      <details>
        <summary className="cursor-pointer text-text-2">Ver a consulta</summary>
        <pre className="overflow-x-auto font-mono text-fact">{source.sql}</pre>
      </details>
      {source.proof !== null && (
        <p className="text-text-2 tabular-nums">
          {`Prova: ${plural(source.proof.rows, 'linha', 'linhas')} em ${when(source.proof.ranAt)}`}
        </p>
      )}
    </div>
  )
}

function fieldLink(field: FieldView, page: ConceptPage, companyId: CompanyId) {
  const codes = page.codes.filter((each) => each.field === field.key)
  if (field.type !== 'CODE' && codes.length === 0) return null
  return (
    <>
      {`${codes.length} · `}
      <Link
        to="/companies/$companyId/knowledge/$concept"
        params={{ companyId, concept: page.concept.key }}
        search={{ campo: field.key }}
        className="underline"
      >
        {SEE_AND_SUGGEST}
      </Link>
    </>
  )
}

function FieldsTable({ companyId, page }: { companyId: CompanyId; page: ConceptPage }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {['Campo', 'Tipo', 'No sistema', 'Códigos'].map((head) => (
            <TableHead key={head}>{head}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {page.fields.map((field) => (
          <TableRow key={field.key}>
            <TableCell>{field.name}</TableCell>
            <TableCell>{fieldTypeText(field)}</TableCell>
            <TableCell className="font-mono text-fact">{field.column}</TableCell>
            <TableCell>{fieldLink(field, page, companyId)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** One relation as the concept on this side reads it: what its other side is called, and the join it goes through. */
function relationText(relation: RelationView, concept: string, names: Names): string {
  const label = relation.from === concept ? relation.fromName : relation.toName
  return relation.through === null ? label : `${label} (pela ${nameOf(names, relation.through)})`
}

function Relations(props: { page: ConceptPage; names: Names }) {
  const mine = props.page.relations.filter(
    (each) => each.from === props.page.concept.key || each.to === props.page.concept.key,
  )
  if (mine.length === 0) return null
  return (
    <p className="break-words">
      <span className="text-text-2">Ligações </span>
      {mine.map((each) => relationText(each, props.page.concept.key, props.names)).join(' · ')}
    </p>
  )
}

function CodeRow(props: {
  companyId: CompanyId
  concept: string
  code: CodeView
  suggesting: boolean
  onSuggest: (value: string | undefined) => void
}) {
  const { code } = props
  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-fact">{code.value}</TableCell>
        <TableCell>{code.label}</TableCell>
        <TableCell className="whitespace-normal">{code.description ?? '—'}</TableCell>
        <TableCell>{code.origin === 'DICTIONARY' ? 'sistema' : 'empresa'}</TableCell>
        <TableCell>
          <Button size="sm" onClick={() => props.onSuggest(code.value)}>
            {SUGGEST}
          </Button>
        </TableCell>
      </TableRow>
      {props.suggesting && (
        <TableRow>
          <TableCell colSpan={5} className="whitespace-normal">
            <SuggestForm
              companyId={props.companyId}
              target={`${props.concept}.${code.field}=${code.value}`}
              title={`Sugerir mudança no ${code.value}`}
              current={{ name: code.label, description: code.description ?? '' }}
              onClose={() => props.onSuggest(undefined)}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

/** The codes of one field, each with **Sugerir mudança**; the field comes from the address (web W18). */
function Codes(props: { companyId: CompanyId; page: ConceptPage; field: string }) {
  const [value, setValue] = useState<string>()
  const field = props.page.fields.find((each) => each.key === props.field)
  const concept = props.page.concept.key
  if (field === undefined)
    return (
      <div className="flex flex-col items-start gap-md">
        <p>{CODE_GONE}</p>
        <Link
          to="/companies/$companyId/knowledge/$concept"
          params={{ companyId: props.companyId, concept }}
          className={buttonVariants()}
        >
          {BACK_TO_CONCEPT}
        </Link>
      </div>
    )
  const codes = props.page.codes.filter((each) => each.field === field.key)
  return (
    <section
      aria-label={`${props.page.concept.name} › ${field.name}`}
      className="flex flex-col gap-md"
    >
      <SectionTitle>{`${props.page.concept.name} › ${field.name}`}</SectionTitle>
      <Table>
        <TableHeader>
          <TableRow>
            {['Código', 'Quer dizer', 'Explicação', 'Origem'].map((head) => (
              <TableHead key={head}>{head}</TableHead>
            ))}
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {codes.map((code) => (
            <CodeRow
              key={code.value}
              companyId={props.companyId}
              concept={concept}
              code={code}
              suggesting={value === code.value}
              onSuggest={setValue}
            />
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

function ConceptBody(props: {
  companyId: CompanyId
  page: ConceptPage
  field: string | undefined
}) {
  const { companyId, page } = props
  const names = useQuery(ontologyQuery(companyId)).data?.concepts ?? []
  const [suggesting, setSuggesting] = useState(false)
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-lg">
      <PageTitle>{page.concept.name}</PageTitle>
      <Standing companyId={companyId} page={page} names={names} />
      <p className="break-words">{page.concept.description}</p>
      <Facts page={page} />
      <SourceBlock companyId={companyId} page={page} />
      <FlowPlace title={`Fluxo do ${page.concept.name}`} />
      <FieldsTable companyId={companyId} page={page} />
      <Relations page={page} names={names} />
      {props.field !== undefined && <Codes companyId={companyId} page={page} field={props.field} />}
      {suggesting ? (
        <SuggestForm
          companyId={companyId}
          target={page.concept.key}
          title={`Sugerir mudança em ${page.concept.name}`}
          current={{ name: page.concept.name, description: page.concept.description }}
          onClose={() => setSuggesting(false)}
        />
      ) : (
        <div className="flex justify-end">
          <Button onClick={() => setSuggesting(true)}>{SUGGEST}</Button>
        </div>
      )}
      <Link
        to="/companies/$companyId/knowledge"
        params={{ companyId }}
        className={buttonVariants({ variant: 'ghost' })}
      >
        Conceitos
      </Link>
    </div>
  )
}

/** A concept's page: what it is, where it is read from and proved, its fields, relations and codes. */
export function ConceptDetail(props: {
  companyId: CompanyId
  concept: string
  field: string | undefined
}) {
  const read = useQuery(conceptQuery(props.companyId, props.concept))
  if (read.isPending) return <Waiting />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  return <ConceptBody companyId={props.companyId} page={read.data} field={props.field} />
}
