import type { CodeView, CompanyId, ConceptPage } from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button, buttonVariants } from '../../ui/button.tsx'
import { List, Row, SectionTitle } from '../../ui/list.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { SuggestForm } from './suggest.tsx'
import { BACK_TO_CONCEPT, CODE_GONE, SUGGEST } from './text.ts'

type CodeProps = {
  companyId: CompanyId
  concept: string
  code: CodeView
  suggesting: boolean
  onSuggest: (value: string | undefined) => void
}

function originText(code: CodeView): string {
  return code.origin === 'DICTIONARY' ? 'sistema' : 'empresa'
}

function CodeSuggest(props: CodeProps) {
  const { code } = props
  return (
    <SuggestForm
      companyId={props.companyId}
      target={`${props.concept}.${code.field}=${code.value}`}
      title={`Sugerir mudança no ${code.value}`}
      current={{ name: code.label, description: code.description ?? '' }}
      onClose={() => props.onSuggest(undefined)}
    />
  )
}

function CodeRow(props: CodeProps) {
  const { code } = props
  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-fact">{code.value}</TableCell>
        <TableCell>{code.label}</TableCell>
        <TableCell className="whitespace-normal">{code.description ?? '—'}</TableCell>
        <TableCell>{originText(code)}</TableCell>
        <TableCell>
          <Button size="sm" onClick={() => props.onSuggest(code.value)}>
            {SUGGEST}
          </Button>
        </TableCell>
      </TableRow>
      {props.suggesting && (
        <TableRow>
          <TableCell colSpan={5} className="whitespace-normal">
            <CodeSuggest {...props} />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

/** On a phone a code is a card: the code and what it says, its explanation and origin, then the button. */
function CodeCard(props: CodeProps) {
  const { code } = props
  return (
    <Row>
      <div className="flex flex-col gap-xs px-sm py-md">
        <p className="break-words">
          <span className="font-mono text-fact">{code.value}</span>
          {` · ${code.label}`}
        </p>
        {code.description !== null && <p className="break-words text-text-2">{code.description}</p>}
        <p className="text-text-2">{originText(code)}</p>
        <Button size="sm" className="self-start" onClick={() => props.onSuggest(code.value)}>
          {SUGGEST}
        </Button>
        {props.suggesting && <CodeSuggest {...props} />}
      </div>
    </Row>
  )
}

function CodesTable(props: { codes: readonly CodeView[]; each: (code: CodeView) => CodeProps }) {
  return (
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
        {props.codes.map((code) => (
          <CodeRow key={code.value} {...props.each(code)} />
        ))}
      </TableBody>
    </Table>
  )
}

function CodesPhone(props: { codes: readonly CodeView[]; each: (code: CodeView) => CodeProps }) {
  return (
    <List>
      {props.codes.map((code) => (
        <CodeCard key={code.value} {...props.each(code)} />
      ))}
    </List>
  )
}

/** The codes of one field, each with **Sugerir mudança**; the field comes from the address (web W18). */
export function Codes(props: { companyId: CompanyId; page: ConceptPage; field: string }) {
  const [value, setValue] = useState<string>()
  const phone = useIsMobile()
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
  function each(code: CodeView): CodeProps {
    return {
      ...{ companyId: props.companyId, concept, code },
      ...{ suggesting: value === code.value, onSuggest: setValue },
    }
  }
  const title = `${props.page.concept.name} › ${field.name}`
  return (
    <section aria-label={title} className="flex flex-col gap-md">
      <SectionTitle>{title}</SectionTitle>
      {phone ? <CodesPhone codes={codes} each={each} /> : <CodesTable codes={codes} each={each} />}
    </section>
  )
}
