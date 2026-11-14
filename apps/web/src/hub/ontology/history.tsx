import type { CompanyId, RevisionEntry } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { sentenceOf } from '../../platform/hub.ts'
import { List, Row } from '../../ui/list.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { revisionsQuery } from './queries.ts'
import { NO_REVISIONS, when } from './text.ts'
import { Waiting } from './waiting.tsx'

function RevisionRow({ revision }: { revision: RevisionEntry }) {
  const approver = revision.approvedBy ?? 'alguém que saiu'
  const proposer = revision.proposedBy ?? 'alguém que saiu'
  return (
    <Row>
      <div className="flex flex-col gap-xs px-sm py-md">
        <p className="break-words font-medium">{`Revisão ${revision.number} · ${revision.demand}`}</p>
        <p className="break-words text-text-2">
          {`Proposta por ${proposer} · aprovada por ${approver} em ${when(revision.approvedAt)}`}
        </p>
        <p className="font-mono text-fact text-text-2">{revision.hash.slice(0, 12)}</p>
      </div>
    </Row>
  )
}

/** **Histórico**: the revisions, the newest first, with who proposed and who approved each. */
export function History({ companyId }: { companyId: CompanyId }) {
  const read = useQuery(revisionsQuery(companyId))
  if (read.isPending) return <Waiting />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  if (read.data.revisions.length === 0) return <Empty>{NO_REVISIONS}</Empty>
  return (
    <List>
      {read.data.revisions.map((revision) => (
        <RevisionRow key={revision.number} revision={revision} />
      ))}
    </List>
  )
}
