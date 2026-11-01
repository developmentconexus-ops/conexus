import type { AutomationSummary, CompanyId, ProjectId } from '@conexus/hub-api'
import { automationPath } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { MoreHorizontalIcon } from 'lucide-react'
import { useState } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf, writeFailureText } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Badge } from '../../ui/badge.tsx'
import { Button, buttonVariants } from '../../ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { List, PageTitle, Row } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { cadenceText } from './cadence-text.ts'
import { Page } from './page.tsx'
import { PlaceName, readNames } from './place.tsx'
import {
  automationsQuery,
  sendAutomationDeletion,
  sendAutomationPause,
  sendAutomationResume,
  sendAutomationRun,
} from './queries.ts'
import {
  ACTIVE,
  AUTOMATIONS_TITLE,
  NEW_CONVERSATION,
  NO_AUTOMATIONS,
  PAUSED,
  RUN_REQUESTED,
  UNCONFIRMED_ACTION,
} from './text.ts'

type Place = { companyId: CompanyId; projectId?: ProjectId }

/** The state of an automation as a word with its dot (design V35), and when it runs next. */
export function StateBadge({ state }: Pick<AutomationSummary, 'state'>) {
  return state === 'ACTIVE' ? <Badge tone="success">{ACTIVE}</Badge> : <Badge>{PAUSED}</Badge>
}

/** The line under a name: when it runs, and, while active, when next. */
export function ScheduleLine({ automation }: { automation: AutomationSummary }) {
  const next =
    automation.nextRunAt === null ? '' : ` · Próxima: ${dayAndHour(automation.nextRunAt)}`
  return (
    <>
      {cadenceText(automation.cadence)}
      {next}
    </>
  )
}

/** The word of the button that pauses an active automation or resumes a paused one, and what it says while the Hub answers. */
function toggleWords(state: AutomationSummary['state'], pending: boolean): string {
  if (state === 'ACTIVE') return pending ? 'Pausando…' : 'Pausar'
  return pending ? 'Retomando…' : 'Retomar'
}

function ConfirmDelete(props: {
  automation: AutomationSummary
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent
        title={`Apagar ${props.automation.name}?`}
        description="Ela deixa de rodar e o histórico some. As conversas que ela abriu ficam."
      >
        <div className="flex flex-wrap gap-md">
          <Button variant="danger-confirm" disabled={props.pending} onClick={props.onConfirm}>
            {props.pending ? 'Apagando…' : 'Apagar'}
          </Button>
          <Button disabled={props.pending} onClick={() => props.onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * The actions of one automation (criterion 19): **Rodar agora**, **Pausar** or **Retomar** and
 * **Apagar** with its confirmation; on a phone the last two go to the menu **⋯**. Each shows the
 * Hub's sentence for a refusal, and an automation the Hub no longer has leaves the list.
 */
export function Actions(props: {
  companyId: CompanyId
  automation: AutomationSummary
  /** Where the person goes once the automation is deleted from its own page. */
  onDeleted?: () => void
}) {
  const { companyId, automation } = props
  const params = { companyId, automationId: automation.id }
  const phone = useIsMobile()
  const [confirming, setConfirming] = useState(false)
  const [note, setNote] = useState<{ kind: 'ok' | 'error'; text: string }>()
  const pause = useMutation(sendAutomationPause)
  const resume = useMutation(sendAutomationResume)
  const run = useMutation(sendAutomationRun)
  const remove = useMutation(sendAutomationDeletion)
  const busy = pause.isPending || resume.isPending || run.isPending || remove.isPending
  const toggle = automation.state === 'ACTIVE' ? pause : resume

  function fail(error: unknown) {
    setNote({ kind: 'error', text: writeFailureText(error, UNCONFIRMED_ACTION) })
  }
  function asRun() {
    run.mutate(
      { params },
      { onSuccess: () => setNote({ kind: 'ok', text: RUN_REQUESTED }), onError: fail },
    )
  }
  function asToggle() {
    toggle.mutate({ params }, { onSuccess: () => setNote(undefined), onError: fail })
  }
  function asDelete() {
    remove.mutate(
      { params },
      {
        onSuccess: () => {
          setConfirming(false)
          props.onDeleted?.()
        },
        onError: (error) => {
          setConfirming(false)
          fail(error)
        },
      },
    )
  }
  const toggleText = toggleWords(automation.state, toggle.isPending)

  return (
    <div className="flex flex-col gap-xs">
      <div className="flex flex-wrap items-center gap-sm">
        <Button size="sm" disabled={busy} onClick={asRun}>
          {run.isPending ? 'Pedindo…' : 'Rodar agora'}
        </Button>
        {phone ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Mais ações: ${automation.name}`}
                />
              }
            >
              <MoreHorizontalIcon aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={busy} onClick={asToggle}>
                {toggleText}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-danger"
                disabled={busy}
                onClick={() => setConfirming(true)}
              >
                Apagar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button size="sm" disabled={busy} onClick={asToggle}>
              {toggleText}
            </Button>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => setConfirming(true)}>
              Apagar
            </Button>
          </>
        )}
      </div>
      {note !== undefined && (
        <p
          role={note.kind === 'error' ? 'alert' : 'status'}
          className={note.kind === 'error' ? 'text-danger' : 'text-text-2'}
        >
          {note.text}
        </p>
      )}
      <ConfirmDelete
        automation={automation}
        open={confirming}
        onOpenChange={setConfirming}
        pending={remove.isPending}
        onConfirm={asDelete}
      />
    </div>
  )
}

function AutomationRow({
  companyId,
  automation,
}: {
  companyId: CompanyId
  automation: AutomationSummary
}) {
  const reads = readNames(automation)
  return (
    <Row>
      <div className="flex min-w-0 flex-1 flex-col gap-sm px-sm py-md">
        <div className="flex min-w-0 items-center justify-between gap-md">
          <Link
            to={automationPath(companyId, automation.projectId, automation.id)}
            className="truncate font-display text-title hover:underline"
          >
            {automation.name}
          </Link>
          <StateBadge state={automation.state} />
        </div>
        <p className="text-text-2">
          <ScheduleLine automation={automation} />
          {' · '}
          <PlaceName companyId={companyId} projectId={automation.projectId} />
          {reads !== '' && ` · ${reads}`}
        </p>
        <Actions companyId={companyId} automation={automation} />
      </div>
    </Row>
  )
}

/**
 * **Automações** (step 24.2, U3; web W29): the person's own, in the Início or in one Projeto, each
 * with its state, its next time and its actions. Empty, it says how to ask for one.
 */
export function Automations(props: Place) {
  const { companyId, projectId } = props
  const read = useQuery(automationsQuery(companyId, projectId))
  return (
    <Page projectId={projectId} gap="xl">
      <PageTitle>{AUTOMATIONS_TITLE}</PageTitle>
      {read.isPending && <Skeleton className="h-24 w-full" />}
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {read.data !== undefined &&
        (read.data.automations.length === 0 ? (
          <div className="flex flex-col items-start gap-md">
            <Empty>{NO_AUTOMATIONS}</Empty>
            <NewConversation companyId={companyId} projectId={projectId} />
          </div>
        ) : (
          <List>
            {read.data.automations.map((automation) => (
              <AutomationRow key={automation.id} companyId={companyId} automation={automation} />
            ))}
          </List>
        ))}
    </Page>
  )
}

function NewConversation({ companyId, projectId }: Place) {
  return projectId === undefined ? (
    <Link
      to="/companies/$companyId"
      params={{ companyId }}
      className={buttonVariants({ variant: 'primary' })}
    >
      {NEW_CONVERSATION}
    </Link>
  ) : (
    <Link
      to="/companies/$companyId/projects/$projectId/assistant"
      params={{ companyId, projectId }}
      className={buttonVariants({ variant: 'primary' })}
    >
      {NEW_CONVERSATION}
    </Link>
  )
}
