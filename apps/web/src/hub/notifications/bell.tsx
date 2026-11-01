import type { CompanyId, NotificationRow } from '@conexus/hub-api'
import { automationPath, conversationPath, phraseOf } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { BellIcon } from 'lucide-react'
import { useState } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { PathLink } from '../../ui/path-link.tsx'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { notificationsQuery, sendNotificationsRead } from './queries.ts'

const EVERY_MINUTE = 60_000
/** The notifications, read again every minute while the window is visible (web W10). */
function polled(companyId: CompanyId) {
  return {
    ...notificationsQuery(companyId),
    refetchInterval: EVERY_MINUTE,
    refetchIntervalInBackground: false,
  }
}

const NO_NOTIFICATIONS = 'Nenhuma notificação.'
const PAUSED_BY_OWNER = 'não roda mais: você não pode perguntar ao Assistente'

/** What a notification says, in the words of the state matrix. */
function textOf(notification: NotificationRow): string {
  const { name } = notification.automation
  switch (notification.kind) {
    case 'AUTOMATION_DONE':
      return `${name} está pronta`
    case 'AUTOMATION_FAILED':
      return `${name} falhou: ${phraseOf(notification.code)}`
    case 'AUTOMATION_PAUSED':
      return `${name} ${PAUSED_BY_OWNER}`
  }
}

/** Where a notification opens: its conversation, or, without one, the page the person can act from (the Início for a pause, criterion 10). */
function pathOf(companyId: CompanyId, notification: NotificationRow): string {
  if (notification.kind === 'AUTOMATION_PAUSED') return `/companies/${companyId}`
  return notification.conversationId === null
    ? automationPath(companyId, notification.projectId, notification.automation.id)
    : conversationPath(companyId, notification.projectId, notification.conversationId)
}

function Item(props: { companyId: CompanyId; notification: NotificationRow; onTap: () => void }) {
  const { notification } = props
  return (
    <li>
      <PathLink
        href={pathOf(props.companyId, notification)}
        onClick={props.onTap}
        className="flex flex-col gap-xs rounded-control px-sm py-sm hover:bg-surface-3"
      >
        <span className={cn('break-words', !notification.read && 'font-medium')}>
          {!notification.read && <span className="sr-only">Não lida: </span>}
          {textOf(notification)}
        </span>
        <span className="text-label text-text-2">{dayAndHour(notification.createdAt)}</span>
      </PathLink>
    </li>
  )
}

function Panel(props: { companyId: CompanyId; onTap: () => void }) {
  const { companyId } = props
  const read = useQuery(polled(companyId))
  const mark = useMutation(sendNotificationsRead)
  if (read.isPending) return <Skeleton className="h-16 w-full" />
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  const { notifications, unread } = read.data
  return (
    <>
      <Button
        size="sm"
        disabled={unread === 0 || mark.isPending}
        onClick={() => mark.mutate({ params: { companyId }, body: { all: true } })}
      >
        Marcar todas como lidas
      </Button>
      {mark.isError && (
        <p role="alert" className="text-danger">
          {sentenceOf(mark.error)}
        </p>
      )}
      {notifications.length === 0 ? (
        <Empty>{NO_NOTIFICATIONS}</Empty>
      ) : (
        <ul className="flex max-h-96 flex-col overflow-y-auto">
          {notifications.map((notification) => (
            <Item
              key={notification.id}
              companyId={companyId}
              notification={notification}
              onTap={() => {
                if (!notification.read)
                  mark.mutate({ params: { companyId }, body: { ids: [notification.id] } })
                props.onTap()
              }}
            />
          ))}
        </ul>
      )}
    </>
  )
}

/**
 * The bell of the frame (step 24.2, U3; web W10): the number of notifications not yet read, read
 * again every minute while the window is visible and when the panel opens. Tapping one opens what
 * it is about and marks it read.
 */
export function NotificationBell({ companyId }: { companyId: CompanyId }) {
  const [open, setOpen] = useState(false)
  const count = useQuery(polled(companyId))
  const unread = count.data?.unread ?? 0
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={unread === 0 ? 'Notificações' : `Notificações: ${unread} não lidas`}
          />
        }
      >
        <BellIcon aria-hidden="true" />
        {unread > 0 && (
          <span aria-hidden="true" className="text-label text-text">
            {unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)]">
        <h2 className="font-display text-title">Notificações</h2>
        <Panel companyId={companyId} onTap={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
