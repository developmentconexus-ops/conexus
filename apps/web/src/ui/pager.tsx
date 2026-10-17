import type { Next } from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'

/**
 * The links that move along a list kept in the address (web W18): the page that follows, and the
 * way back to the first once the person has left it. `param` is the search parameter that holds
 * this list's page; the other parameters of the address stay as they are.
 */
export function Pager(props: {
  next: Next
  param: string
  page: string | undefined
  list: string
}) {
  function toPage(page: string | undefined, label: string) {
    return (
      <Link
        aria-label={`${label}: ${props.list}`}
        to="."
        search={(old) => ({ ...old, [props.param]: page })}
      >
        {label}
      </Link>
    )
  }
  return (
    <div className="flex gap-lg text-label">
      {props.page !== undefined && toPage(undefined, 'Primeira página')}
      {props.next.kind === 'MORE' && toPage(props.next.page, 'Ver mais')}
    </div>
  )
}
