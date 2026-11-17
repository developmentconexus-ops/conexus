import { ChevronsUpDownIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu.tsx'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from './sidebar.tsx'

type Head = { icon: ReactNode; title: ReactNode }

function SidebarHead({ icon, title }: Head) {
  return (
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
}

/** The head as the button that opens a list to switch place: a menu here, or a place's own list. */
export function SidebarSwitch({
  icon,
  title,
  ...props
}: Head & Omit<ComponentProps<'button'>, 'title'>) {
  return (
    <SidebarMenuButton size="lg" className="px-0" {...props}>
      <SidebarHead icon={icon} title={title} />
      <ChevronsUpDownIcon aria-hidden="true" className="ml-auto" />
    </SidebarMenuButton>
  )
}

/** The head of a sidebar: an icon tile and a title; with `children`, the menu to switch place. */
export function SidebarSelector({
  icon,
  title,
  label,
  children,
}: Head & {
  label?: string
  children?: ReactNode
}) {
  const { isMobile } = useSidebar()
  const trigger =
    children === undefined ? (
      <div className="flex h-12 items-center gap-sm group-data-[collapsible=icon]:px-0">
        <SidebarHead icon={icon} title={title} />
      </div>
    ) : (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<SidebarSwitch icon={icon} title={title} />}
          aria-label={label}
        />
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
