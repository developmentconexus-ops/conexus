import type { CompanyId, ProjectConnections, ProjectId } from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Badge } from '../../ui/badge.tsx'
import { Button } from '../../ui/button.tsx'
import { List, PageTitle, Row } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, NotFound, ReadFailure } from '../../ui/states.tsx'
import {
  ASK_MANAGER,
  ConnectorLogo,
  connectionsQuery,
  GRANTED_TEXT,
  LINK_IN_COMPANY,
  LOADING_PROJECT_CONNECTIONS,
  NO_COMPANY_CONNECTIONS,
  NOT_GRANTED_TEXT,
  oneAtATimeText,
  PROJECT_LEAD,
  projectConnectionsKey,
  projectConnectionsQuery,
  RECONNECT_IN_COMPANY,
  REVOKE,
  sendRevoke,
  stateBadge,
} from '../connectors/public.ts'
import { GrantDialog } from './grant-dialog.tsx'

type Scope = { companyId: CompanyId; projectId: ProjectId }
type Group = ProjectConnections['connectors'][number]
type Line = Group['connections'][number]

function Revoke({ companyId, projectId, line }: Scope & { line: Line }) {
  const queryClient = useQueryClient()
  const revoke = useMutation({
    ...sendRevoke,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: projectConnectionsKey(companyId, projectId) }),
  })
  return (
    <span className="flex flex-col items-start gap-xs">
      <Button
        size="sm"
        aria-label={`${REVOKE}: ${line.name}`}
        disabled={revoke.isPending}
        onClick={() => revoke.mutate({ params: { companyId, projectId, connectionId: line.id } })}
      >
        {revoke.isPending ? 'Tirando…' : REVOKE}
      </Button>
      {revoke.isError && (
        <span role="alert" className="text-label text-danger">
          {sentenceOf(revoke.error)}
        </span>
      )}
    </span>
  )
}

/** What the person may do on a line: Tirar if it is read; else Liberar, unless a `one` connector already reads another, which it names. */
function Action(props: Scope & { group: Group; line: Line; mayManage: boolean }) {
  const { group, line } = props
  if (!props.mayManage) return null
  if (line.grant !== null)
    return <Revoke companyId={props.companyId} projectId={props.projectId} line={line} />
  const taken =
    group.perProject === 'one' ? group.connections.find((one) => one.grant !== null) : undefined
  if (taken !== undefined) {
    return <span className="text-text-2">{oneAtATimeText(group.connector.name, taken.name)}</span>
  }
  return (
    <GrantDialog
      companyId={props.companyId}
      projectId={props.projectId}
      connectionId={line.id}
      connectionName={line.name}
      connectorName={group.connector.name}
    />
  )
}

function Connection(
  props: Scope & {
    group: Group
    line: Line
    mayManage: boolean
    auth: Parameters<typeof stateBadge>[1]
  },
) {
  const { line, group } = props
  const badge = stateBadge({ state: line.state }, props.auth)
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-md gap-y-sm border-b border-line px-sm py-md last:border-b-0">
      <span className="flex min-w-0 flex-col gap-xs">
        <span className="flex flex-wrap items-center gap-x-sm gap-y-xs">
          <span className="wrap-anywhere font-medium">{line.name}</span>
          {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
        </span>
        <span className="text-text-2">
          {line.grant === null ? NOT_GRANTED_TEXT : GRANTED_TEXT}
          {line.account !== null && ` · conta ${line.account.label}`}
        </span>
        {line.state === 'NEEDS_REAUTH' && (
          <Link
            to="/companies/$companyId/integrations/$connectionId"
            params={{ companyId: props.companyId, connectionId: line.id }}
            className="w-fit text-text-2 underline underline-offset-2"
          >
            {RECONNECT_IN_COMPANY}
          </Link>
        )}
      </span>
      <Action {...props} group={group} />
    </li>
  )
}

function Loading() {
  return (
    <div className="flex flex-col gap-md">
      <span className="sr-only" role="status">
        {LOADING_PROJECT_CONNECTIONS}
      </span>
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
    </div>
  )
}

/**
 * Integrações do Projeto: the company's connections, by connector, with whether this Projeto may
 * read each (the founder's S1: the whole connection). The owner and the administrators grant and
 * take away; a member reads and is told who can. A connector that serves one connection per
 * Projeto leaves Liberar on no other line while one is read, and says which to take away first.
 */
export function ProjectIntegrations(scope: Scope) {
  const { companyId, projectId } = scope
  const read = useQuery(projectConnectionsQuery(companyId, projectId))
  const company = useQuery(connectionsQuery(companyId))
  if (read.error instanceof HubFailure && read.error.code === 'NOT_FOUND') return <NotFound />
  // The lines say what the Projeto reads and the company's list says who may change it and how each
  // connector signs in, so the page waits for both and fails with either.
  const failure = read.error ?? company.error ?? undefined
  const shown = read.data !== undefined && company.data !== undefined
  const mayManage = company.data?.mayManage === true
  const groups = read.data?.connectors.filter((group) => group.connections.length > 0)
  return (
    <section className="flex w-full max-w-page flex-col gap-lg">
      <PageTitle>{PROJECT_LEAD}</PageTitle>
      {shown && !mayManage && <p className="text-text-2">{ASK_MANAGER}</p>}
      {failure === undefined && !shown && <Loading />}
      {failure !== undefined && (
        <ReadFailure
          text={sentenceOf(failure)}
          onRetry={() => void Promise.all([read.refetch(), company.refetch()])}
        />
      )}
      {shown && groups?.length === 0 && (
        <div className="flex flex-col items-start gap-sm">
          <Empty>{NO_COMPANY_CONNECTIONS}</Empty>
          {mayManage && (
            <Link
              to="/companies/$companyId/integrations"
              params={{ companyId }}
              className="text-text-2 underline underline-offset-2"
            >
              {LINK_IN_COMPANY}
            </Link>
          )}
        </div>
      )}
      {shown && groups !== undefined && groups.length > 0 && (
        <List>
          {groups.map((group) => (
            <Row key={group.connector.id}>
              <div className="flex items-center gap-md px-sm py-md">
                <ConnectorLogo entry={group.connector} />
                <span className="font-medium">{group.connector.name}</span>
                <Badge>{group.connector.category}</Badge>
              </div>
              <ul className="ml-md border-t border-line sm:ml-14">
                {group.connections.map((line) => (
                  <Connection
                    key={line.id}
                    {...scope}
                    group={group}
                    line={line}
                    mayManage={mayManage}
                    auth={
                      company.data?.connectors.find((one) => one.id === group.connector.id)?.auth ??
                      'client_credentials'
                    }
                  />
                ))}
              </ul>
            </Row>
          ))}
        </List>
      )}
    </section>
  )
}
