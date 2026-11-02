import type { CompanyId, NotificationRow } from '@conexus/hub-api'
import { automationPath, conversationPath, phraseOf } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { BellIcon } from 'lucide-react'
import { useState } from 'react'
import { dayAndHour } from '../../platform/dates.ts'
import { sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
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

function unreadText(count: number): string {
  return count === 1 ? '1 não lida' : `${count} não lidas`
}

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

/** Where a notification opens: its conversation, or, without one, its automation's page. A pause opens the Início, where a person can ask again. */
function pathOf(
  companyId: CompanyId,
  notification: Exclude<NotificationRow, { kind: 'AUTOMATION_PAUSED' }>,
): string {
  return notification.conversationId === null
    ? automationPath(companyId, notification.projectId, notification.automation.id)
    : conversationPath(companyId, notification.projectId, notification.conversationId)
}

function Item(props: { companyId: CompanyId; notification: NotificationRow; onTap: () => void }) {
  const { companyId, notification } = props
  const link = {
    onClick: props.onTap,
    className: 'flex items-start gap-sm rounded-control px-sm py-sm hover:bg-surface-3',
  }
  const content = (
    <>
      <span
        aria-hidden="true"
        className={cn('mt-xs size-2 shrink-0 rounded-pill', !notification.read && 'bg-ink')}
      />
      <span className="flex min-w-0 flex-col gap-xs">
        <span
          className={cn('break-words', notification.read ? 'text-text-2' : 'font-medium text-text')}
        >
          {!notification.read && <span className="sr-only">Não lida: </span>}
          {textOf(notification)}
        </span>
        <span className="text-label text-text-2">{dayAndHour(notification.createdAt)}</span>
      </span>
    </>
  )
  return (
    <li>
      {notification.kind === 'AUTOMATION_PAUSED' ? (
        <Link to="/companies/$companyId" params={{ companyId }} {...link}>
          {content}
        </Link>
      ) : (
        <Link to={pathOf(companyId, notification)} {...link}>
          {content}
        </Link>
      )}
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
      {unread > 0 && (
        <Button
          size="sm"
          disabled={mark.isPending}
          onClick={() => mark.mutate({ params: { companyId }, body: { all: true } })}
        >
          Marcar todas como lidas
        </Button>
      )}
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
            className="relative"
            aria-label={unread === 0 ? 'Notificações' : `Notificações: ${unreadText(unread)}`}
          />
        }
      >
        <BellIcon aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-xs -right-xs grid h-4 min-w-4 place-items-center rounded-pill bg-danger px-xs text-label text-on-ink"
          >
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
