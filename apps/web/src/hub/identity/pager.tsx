import type { Next } from '@conexus/hub-api'
import type { ReactNode } from 'react'

/**
 * The links that move along a list kept in the address (web W18): the page that follows, and the
 * way back to the first once the person has left it. `link` draws a link to a page of this list.
 */
export function Pager(props: {
  next: Next
  page: string | undefined
  link: (page: string | undefined, label: string) => ReactNode
}) {
  return (
    <div className="flex gap-lg text-label">
      {props.page !== undefined && props.link(undefined, 'Primeira página')}
      {props.next.kind === 'MORE' && props.link(props.next.page, 'Ver mais')}
    </div>
  )
}
