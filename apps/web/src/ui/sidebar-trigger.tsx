import type { ReactNode } from 'react'
import { touchArea } from './button.tsx'
import { cn } from './cn.ts'
import { useSidebar } from './sidebar.tsx'

/** The phone top bar's button that opens the drawer. */
export function SidebarTrigger(props: {
  label: string
  /** Something waits in the drawer: a dot on the button, its words added to the name. */
  note?: string
  children: ReactNode
}) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      type="button"
      data-sidebar="trigger"
      aria-label={props.note === undefined ? props.label : `${props.label}, ${props.note}`}
      onClick={toggleSidebar}
      className={cn(
        touchArea,
        'relative inline-flex size-control shrink-0 items-center justify-center rounded-control text-text-2 hover:bg-surface-3 hover:text-text [&_svg]:size-3.5',
      )}
    >
      {props.children}
      {props.note !== undefined && (
        <span
          data-slot="sidebar-trigger-dot"
          aria-hidden="true"
          className="absolute top-1 right-1 size-2 rounded-pill bg-danger"
        />
      )}
    </button>
  )
}
