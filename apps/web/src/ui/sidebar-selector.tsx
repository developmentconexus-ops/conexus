import { ChevronsUpDownIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu.tsx'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from './sidebar.tsx'

/** The head of a sidebar: an icon tile and a title; with `children`, the menu to switch place. */
export function SidebarSelector({
  icon,
  title,
  label,
  children,
}: {
  icon: ReactNode
  title: ReactNode
  label?: string
  children?: ReactNode
}) {
  const { isMobile } = useSidebar()
  const head = (
    <>
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-control bg-ink font-display text-label text-on-ink"
      >
        {icon}
      </span>
      <span className="grid min-w-0 flex-1 text-left">
        <span className="truncate font-display text-title text-text">{title}</span>
      </span>
    </>
  )
  const trigger =
    children === undefined ? (
      <div className="flex h-12 items-center gap-sm group-data-[collapsible=icon]:px-0">{head}</div>
    ) : (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<SidebarMenuButton size="lg" className="px-0" />}
          aria-label={label}
        >
          {head}
          <ChevronsUpDownIcon aria-hidden="true" className="ml-auto" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side={isMobile ? 'bottom' : 'right'}>
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  return (
    <SidebarMenu>
      <SidebarMenuItem>{trigger}</SidebarMenuItem>
    </SidebarMenu>
  )
}
