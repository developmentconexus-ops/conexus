import type { CompanyId, CopyId, ProjectId } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Badge } from '../../ui/badge.tsx'
import { Button } from '../../ui/button.tsx'
import { List, Row, SectionTitle } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { projectCopiesQuery, sendCopyGrant, sendCopyRevoke } from './queries.ts'

const company = getRouteApi('/_app/companies/$companyId')

const NO_COPIES = 'A empresa ainda não tem cópias.'
const LINK_COPIES = 'Ligar uma cópia'
const ASK_MANAGER = 'Dono, administrador ou desenvolvedor libera uma cópia.'

type Scope = { companyId: CompanyId; projectId: ProjectId }

/** Liberar or Tirar one copy: every read is stale when it settles, a refusal says why and leaves the button. */
function Release(props: Scope & { copyId: CopyId; label: string; granted: boolean }) {
  const { companyId, projectId, copyId, label, granted } = props
  const grant = useMutation(sendCopyGrant)
  const revoke = useMutation(sendCopyRevoke)
  const send = granted ? revoke : grant
  const word = granted ? 'Tirar' : 'Liberar'
  return (
    <div className="flex flex-col items-start gap-xs">
      <Button
        size="sm"
        aria-label={`${word}: ${label}`}
        disabled={send.isPending}
        onClick={() => send.mutate({ params: { companyId, projectId, copyId } })}
      >
        {send.isPending ? (granted ? 'Tirando…' : 'Liberando…') : word}
      </Button>
      {send.isError && <Alert tone="danger">{sentenceOf(send.error)}</Alert>}
    </div>
  )
}

/**
 * Integrações do Projeto, the Cópias section: the company's copies with whether this Projeto may
 * read each, Liberar and Tirar for whoever manages copies. The Hub answers the list to those who
 * manage them alone, so the others are told who can.
 */
export function ProjectCopies(scope: Scope) {
  const { companyId, projectId } = scope
  const { may } = company.useRouteContext()
  const read = useQuery({
    ...projectCopiesQuery(companyId, projectId),
    enabled: may.manageCopies,
  })
  return (
    <section aria-label="Cópias" className="flex flex-col gap-md">
      <SectionTitle>Cópias</SectionTitle>
      {!may.manageCopies && <p className="text-text-2">{ASK_MANAGER}</p>}
      {may.manageCopies && read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {may.manageCopies && read.isPending && !read.isError && (
        <div role="status">
          <span className="sr-only">Carregando as cópias</span>
          <Skeleton className="h-12" />
        </div>
      )}
      {read.data?.copies.length === 0 && (
        <div className="flex flex-col items-start gap-sm">
          <Empty>{NO_COPIES}</Empty>
          <Link
            to="/companies/$companyId/copies"
            params={{ companyId }}
            className="text-text-2 underline underline-offset-2"
          >
            {LINK_COPIES}
          </Link>
        </div>
      )}
      {read.data !== undefined && read.data.copies.length > 0 && (
        <List>
          {read.data.copies.map(({ copy, granted }) => (
            <Row key={copy.id}>
              <div className="flex flex-wrap items-center justify-between gap-x-md gap-y-sm px-sm py-md">
                <span className="flex min-w-0 flex-col gap-xs">
                  <span className="flex flex-wrap items-center gap-x-sm gap-y-xs">
                    <span className="wrap-anywhere font-medium">{copy.label}</span>
                    {granted && <Badge tone="success">Liberada</Badge>}
                  </span>
                  <span className="wrap-anywhere font-mono text-fact text-text-2">{copy.name}</span>
                </span>
                <Release {...scope} copyId={copy.id} label={copy.label} granted={granted} />
              </div>
            </Row>
          ))}
        </List>
      )}
    </section>
  )
}
