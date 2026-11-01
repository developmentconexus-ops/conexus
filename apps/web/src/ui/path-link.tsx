import { useRouter } from '@tanstack/react-router'
import type { ComponentProps, MouseEvent } from 'react'

/**
 * A link to a path the Hub's contract built (`conversationPath`, `automationPath`): the owner of
 * that path is the contract, not a route literal, so the router takes it as an `href`. A plain
 * click navigates inside the page; a click with a key, or a middle click, is the browser's.
 */
export function PathLink({ href, onClick, ...rest }: ComponentProps<'a'> & { href: string }) {
  const router = useRouter()
  function follow(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event)
    const plain =
      event.button === 0 && !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    if (event.defaultPrevented || !plain) return
    event.preventDefault()
    void router.navigate({ href })
  }
  return <a href={href} onClick={follow} {...rest} />
}
