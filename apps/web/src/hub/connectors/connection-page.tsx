import type { TestResult as Answer, CompanyId, Connection, ConnectorEntry } from '@conexus/hub-api'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeftIcon, MoreHorizontalIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Badge } from '../../ui/badge.tsx'
import { Button } from '../../ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { PageTitle, SectionTitle } from '../../ui/list.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { ConnectorLogo } from './logo.tsx'
import { connectionKeys, connectionQuery, connectionsQuery, sendTest } from './queries.ts'
import type { Check } from './test-result.tsx'
import { countOf, Said, TestResult } from './test-result.tsx'
import {
  connectorName,
  linkedText,
  MEMBER_SENTENCE,
  NOT_TESTED_YET,
  PARTIAL_BADGE,
  refusedKeysMemberText,
  refusedKeysText,
  stateBadge,
  testedText,
  testingText,
  UNREADABLE_TEXT,
  unreachableText,
  wholeSubjectsText,
} from './text.ts'
import { UnlinkDialog } from './unlink-dialog.tsx'

const route = getRouteApi('/_app/companies/$companyId/integrations/$connectionId')

function BackLink(props: { companyId: CompanyId }) {
  return (
    <Link
      to="/companies/$companyId/integrations"
      params={{ companyId: props.companyId }}
      className="inline-flex w-fit items-center gap-xs text-text-2 underline underline-offset-2"
    >
      <ArrowLeftIcon aria-hidden="true" className="size-3.5" />
      Integrações
    </Link>
  )
}

function isGone(error: unknown) {
  return error instanceof HubFailure && error.code === 'CONNECTION_NOT_FOUND'
}

/** The page's `errorComponent`: a connection that is gone says so and leads back to the list. */
export function ConnectionReadFailure(props: { error: unknown; reset: () => void }) {
  const { companyId } = route.useParams()
  if (isGone(props.error)) {
    return (
      <div className="flex flex-col items-start gap-md">
        <p role="alert" className="text-danger">
          {sentenceOf(props.error)}
        </p>
        <BackLink companyId={companyId} />
      </div>
    )
  }
  return <ReadFailure text={sentenceOf(props.error)} onRetry={props.reset} />
}

/** What a Testar that did not reach the reads says, with what the provider answered. */
function TestRefusal(props: { answer: Exclude<Answer, { result: 'WORKING' }>; name: string }) {
  const { answer, name } = props
  const sentence = {
    AUTH_REFUSED: refusedKeysText(name),
    UNREACHABLE: unreachableText(name),
    UNREADABLE: UNREADABLE_TEXT,
  }[answer.result]
  return (
    <div role="alert" className="flex flex-col gap-xs">
      <p className="text-danger">{sentence}</p>
      {answer.native !== null && <Said native={answer.native} name={name} />}
    </div>
  )
}

function Actions(props: { busy: boolean; onTest: () => void; onUnlink: () => void }) {
  return (
    <div className="flex gap-sm">
      <Button disabled={props.busy} onClick={props.onTest}>
        {props.busy ? 'Testando…' : 'Testar'}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" aria-label="Mais ações" />}
        >
          <MoreHorizontalIcon aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="text-danger" onClick={props.onUnlink}>
            Desligar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function Header(props: {
  entry: ConnectorEntry | undefined
  name: string
  connection: Connection
  partial: boolean
  actions: React.ReactNode
}) {
  const { entry, connection } = props
  const badge = props.partial
    ? { text: PARTIAL_BADGE, tone: 'warning' as const }
    : stateBadge(connection)
  return (
    <div className="flex flex-wrap items-start justify-between gap-md">
      <div className="flex min-w-0 items-center gap-lg">
        {entry && <ConnectorLogo entry={entry} large />}
        <div className="flex min-w-0 flex-col gap-xs">
          <span className="text-text-2">
            {props.name}
            {entry && ` · ${entry.category}`}
          </span>
          <PageTitle className="break-words">{connection.name}</PageTitle>
          <span className="flex flex-wrap items-center gap-x-sm gap-y-xs">
            {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
            <span className="text-text-2">{linkedText(connection)}</span>
          </span>
        </div>
      </div>
      {props.actions}
    </div>
  )
}

/** What the last test found: the subjects that read whole, and the sentence of whatever stopped a new one. */
function LastTest(props: {
  name: string
  reads: number
  checks: readonly Check[] | null
  connection: Connection
  pending: boolean
  error: unknown
  answer: Answer | undefined
}) {
  const { name, checks, connection, answer } = props
  const { subjects, whole } = countOf(checks)
  return (
    <section aria-label="O que o Conexus lê" className="flex flex-col gap-md">
      <SectionTitle>O que o Conexus lê</SectionTitle>
      {props.pending && (
        <p role="status" className="text-text-2">
          {testingText(props.reads)}
        </p>
      )}
      {props.error !== null && (
        <p role="alert" className="text-danger">
          {sentenceOf(props.error)}
        </p>
      )}
      {answer && answer.result !== 'WORKING' && <TestRefusal answer={answer} name={name} />}
      {checks === null ? (
        <p className="text-text-2">{NOT_TESTED_YET}</p>
      ) : (
        <>
          <p className="flex flex-wrap items-baseline gap-x-md gap-y-xs">
            <span className="font-medium">{wholeSubjectsText(whole, subjects)}</span>
            {connection.testedAt !== null && (
              <span className="text-text-2">
                {testedText(connection.testedAt)}
                {connection.testedBy !== null && `, por ${connection.testedBy.name}`}
              </span>
            )}
          </p>
          <TestResult checks={checks} name={name} />
        </>
      )}
    </section>
  )
}

function Facts(props: { name: string; connection: Connection }) {
  return (
    <section aria-label="A ligação" className="flex flex-col gap-md">
      <SectionTitle>A ligação</SectionTitle>
      <dl className="flex flex-col gap-xs">
        <div className="flex flex-wrap gap-x-md">
          <dt className="text-text-2">Conector</dt>
          <dd>
            {props.name}{' '}
            <span className="font-mono text-fact">{props.connection.connectorVersion}</span>
          </dd>
        </div>
      </dl>
    </section>
  )
}

/**
 * One connection: who linked it, its state, the last test (kept by the Hub, so it is here after a
 * reload) and, for an owner or an administrator, Testar and Desligar. What a Testar found stays
 * on this page only; another connection of the same connector has its own.
 */
export function ConnectionPage() {
  const { companyId, connectionId } = route.useParams()
  const { testar } = route.useSearch()
  const { connectors, mayManage } = useSuspenseQuery(connectionsQuery(companyId)).data
  const detail = useSuspenseQuery(connectionQuery(companyId, connectionId)).data
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [unlinking, setUnlinking] = useState(false)
  const test = useMutation({
    ...sendTest,
    onSettled: () => {
      for (const queryKey of connectionKeys(companyId, connectionId)) {
        void queryClient.invalidateQueries({ queryKey })
      }
    },
  })
  // Someone else unlinked it: the sentence stays, and so does the way back, but there is nothing left to do here.
  const gone = isGone(test.error)
  const entry = connectors.find((one) => one.id === detail.connection.connector)
  const name = connectorName(connectors, detail.connection.connector)
  const connection = test.data?.connection ?? detail.connection
  const fresh = test.data?.result === 'WORKING' ? test.data.checks : undefined
  const checks: readonly Check[] | null = fresh ?? detail.lastTest
  const { subjects, whole } = countOf(checks)

  function run() {
    test.mutate({ params: { companyId, connectionId } })
  }
  // "Ligar e testar" lands here with `testar`: it starts the first test once, then leaves the address clean.
  const started = useRef(false)
  useEffect(() => {
    if (!testar || started.current) return
    started.current = true
    if (mayManage) test.mutate({ params: { companyId, connectionId } })
    void navigate({ to: '.', search: {}, replace: true })
  }, [testar, mayManage, companyId, connectionId, navigate, test.mutate])

  return (
    <div className="flex w-full max-w-page flex-col gap-xl">
      <BackLink companyId={companyId} />
      <Header
        entry={entry}
        name={name}
        connection={connection}
        partial={connection.state === 'ACTIVE' && subjects > whole}
        actions={
          mayManage &&
          !gone && (
            <Actions busy={test.isPending} onTest={run} onUnlink={() => setUnlinking(true)} />
          )
        }
      />
      {!mayManage && <p className="text-text-2">{MEMBER_SENTENCE}</p>}
      {connection.state === 'NEEDS_REAUTH' && (
        <p role="alert" className="text-danger">
          {mayManage ? refusedKeysText(name) : refusedKeysMemberText(name)}
        </p>
      )}
      <LastTest
        name={name}
        reads={entry?.reads ?? 0}
        checks={checks}
        connection={connection}
        pending={test.isPending}
        error={test.error}
        answer={test.data}
      />
      <Facts name={name} connection={connection} />
      {mayManage && (
        <UnlinkDialog
          companyId={companyId}
          connection={connection}
          open={unlinking}
          onOpenChange={setUnlinking}
        />
      )}
    </div>
  )
}
