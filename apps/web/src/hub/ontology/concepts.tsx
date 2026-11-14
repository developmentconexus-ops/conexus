import type { CompanyId, ConceptRow, OntologyView } from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'
import { List, Row } from '../../ui/list.tsx'
import { Empty } from '../../ui/states.tsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import {
  isText,
  NO_CONCEPTS,
  NO_FLOW,
  NO_FLOW_MORE,
  plural,
  stateText,
  TO_HISTORY,
  when,
} from './text.ts'

/** The place of the flow, empty until its step: the same frase at the top of Conceitos and of a concept. */
export function FlowPlace({ title }: { title: string }) {
  return (
    <section
      aria-label={title}
      className="flex flex-col gap-xs rounded-card border border-dashed border-line p-md"
    >
      <p>{NO_FLOW}</p>
      <p className="text-text-2">{NO_FLOW_MORE}</p>
    </section>
  )
}

function ConceptLink(props: { companyId: CompanyId; concept: ConceptRow }) {
  return (
    <Link
      to="/companies/$companyId/knowledge/$concept"
      params={{ companyId: props.companyId, concept: props.concept.key }}
      className="font-medium hover:underline"
    >
      {props.concept.name}
    </Link>
  )
}

function ConceptsTable(props: { companyId: CompanyId; concepts: ConceptRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {['Conceito', 'É', 'Lido de', 'Campos', 'Códigos', 'Estado'].map((head) => (
            <TableHead key={head}>{head}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.concepts.map((concept) => (
          <TableRow key={concept.key}>
            <TableCell>
              <ConceptLink companyId={props.companyId} concept={concept} />
            </TableCell>
            <TableCell>{isText(concept, props.concepts)}</TableCell>
            <TableCell>{concept.source ?? '—'}</TableCell>
            <TableCell className="tabular-nums">{concept.fields}</TableCell>
            <TableCell className="tabular-nums">{concept.codes}</TableCell>
            <TableCell>{stateText(concept.state)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ConceptsPhone(props: { companyId: CompanyId; concepts: ConceptRow[] }) {
  return (
    <List>
      {props.concepts.map((concept) => (
        <Row key={concept.key}>
          <div className="flex flex-col gap-xs px-sm py-md">
            <ConceptLink companyId={props.companyId} concept={concept} />
            <span className="text-text-2">{isText(concept, props.concepts)}</span>
            {concept.source !== null && (
              <span className="break-words text-text-2">{`Lido de ${concept.source}`}</span>
            )}
            <span className="text-text-2 tabular-nums">
              {`${plural(concept.fields, 'campo', 'campos')} · ${plural(concept.codes, 'código', 'códigos')} · ${stateText(concept.state)}`}
            </span>
          </div>
        </Row>
      ))}
    </List>
  )
}

function RevisionLine({ revision }: { revision: NonNullable<OntologyView['revision']> }) {
  const by = revision.approvedBy ?? 'alguém que saiu'
  return (
    <p className="text-text-2">
      {`Revisão atual: ${revision.number}, aprovada por ${by} em ${when(revision.approvedAt)} · `}
      <Link to="." search={{ aba: 'historico' }} className="underline">
        {TO_HISTORY}
      </Link>
    </p>
  )
}

/** **Conceitos**: the flow's place, the company's concepts (a table, or cards on a phone) and the revision they stand on. */
export function Concepts(props: { companyId: CompanyId; view: OntologyView }) {
  const { companyId, view } = props
  const phone = useIsMobile()
  return (
    <div className="flex flex-col gap-lg">
      <FlowPlace title="Fluxos" />
      {view.concepts.length === 0 && <Empty>{NO_CONCEPTS}</Empty>}
      {view.concepts.length > 0 && phone && (
        <ConceptsPhone companyId={companyId} concepts={view.concepts} />
      )}
      {view.concepts.length > 0 && !phone && (
        <ConceptsTable companyId={companyId} concepts={view.concepts} />
      )}
      {view.revision !== null && <RevisionLine revision={view.revision} />}
    </div>
  )
}
