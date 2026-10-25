import type { LinkProps } from '@tanstack/react-router'
import { Link, useMatches, useRouter } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { MenuIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ConexusWordmark } from '../brand/mark.tsx'
import { cn } from './cn.ts'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from './sidebar.tsx'

/** The centred column under the arriving wordmark, for the pages without a session. */
export function Column({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas p-lg pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex w-full max-w-column flex-col items-center gap-xl">
        <ConexusWordmark arrive />
        {children}
      </div>
    </main>
  )
}

const InFrame = createContext(false)

/** Whether a page is drawn inside a frame, so its waits and failures stay in the content area. */
export function useInFrame(): boolean {
  return useContext(InFrame)
}

const PhoneSlot = createContext<HTMLElement | null | undefined>(undefined)

/**
 * What a page puts in the phone's top line, after the mark: the page names its own controls and the
 * frame lends the room (`ui/` imports no subject). Without a frame it draws in place. Lay out the
 * content with `order-*`: several pieces share the line.
 */
export function PhoneTopContent({ children }: { children: ReactNode }) {
  const slot = useContext(PhoneSlot)
  if (slot === undefined) return children
  return slot === null ? null : createPortal(children, slot)
}

/** A place in the sidebar; the router marks the current one (design `nav-item`). */
export function FrameLink(
  props: Pick<LinkProps, 'to' | 'params' | 'search' | 'activeOptions'> & {
    icon?: LucideIcon
    label: string
  },
) {
  const { icon: Icon, label, ...link } = props
  return (
    <SidebarMenuItem>
      <SidebarMenuButton tooltip={label} render={<Link {...link} />}>
        {Icon && <Icon aria-hidden="true" />}
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

/**
 * The phone's top line: the button that opens the drawer, the mark and the current place (V56), its
 * route's `staticData.place`, or the section's label for a section of Configurações.
 */
function PhoneTop(props: { slot: (element: HTMLElement | null) => void }) {
  const place = useMatches({
    select: (matches) => {
      const shown = matches.at(-1)?.staticData
      return shown?.place ?? shown?.section?.label
    },
  })
  return (
    <header className="flex min-h-[calc(3.5rem+env(safe-area-inset-top))] items-center gap-sm border-b border-line bg-surface px-md pt-[env(safe-area-inset-top)] md:hidden">
      <SidebarTrigger label="Abrir navegação">
        <MenuIcon aria-hidden="true" />
      </SidebarTrigger>
      <span className="max-[22rem]:hidden">
        <ConexusWordmark word="md" />
      </span>
      <div
        ref={props.slot}
        className="peer flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-sm gap-y-xs py-xs empty:hidden"
      />
      {place !== undefined && <p className="truncate text-text-2 peer-not-empty:hidden">{place}</p>}
    </header>
  )
}

/**
 * Following a link in the drawer closes it (V56): the drawer closes once a navigation resolves. The
 * page's first load has no location to come from, and a drawer opened while it resolves stays open.
 */
function CloseOnNavigation() {
  const { setOpenMobile } = useSidebar()
  const router = useRouter()
  useEffect(
    () =>
      router.subscribe('onResolved', ({ fromLocation }) => {
        if (fromLocation !== undefined) setOpenMobile(false)
      }),
    [router, setOpenMobile],
  )
  return null
}

/**
 * The frame of every page with a session (web W30): one sidebar on the left and no top bar. The
 * sidebar holds `header`, `nav` and `footer`; `compact` closes it to icons, and it opens again when
 * `compact` ends, and the page fills the rest of the screen edge to edge, for a Projeto's two
 * regions. On a phone it is a drawer under a top line naming the place (design V56).
 */
export function Frame(props: {
  header: ReactNode
  nav: ReactNode
  footer: ReactNode
  compact: boolean
  children: ReactNode
}) {
  // Ctrl+B or the rail may open it in a Project; leaving the Project opens it again.
  const [open, setOpen] = useState(!props.compact)
  const [compact, setCompact] = useState(props.compact)
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  if (compact !== props.compact) {
    setCompact(props.compact)
    setOpen(!props.compact)
  }
  return (
    <SidebarProvider open={open} onOpenChange={setOpen} className={cn(compact && 'h-dvh')}>
      <Sidebar label="Navegação">
        <SidebarHeader>{props.header}</SidebarHeader>
        <SidebarContent>{props.nav}</SidebarContent>
        <SidebarFooter>{props.footer}</SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <CloseOnNavigation />
      <SidebarInset>
        <PhoneTop slot={setSlot} />
        <PhoneSlot.Provider value={slot}>
          <InFrame.Provider value={true}>
            <div className={cn('flex min-w-0 flex-1 flex-col', compact ? 'min-h-0' : 'p-xl')}>
              {props.children}
            </div>
          </InFrame.Provider>
        </PhoneSlot.Provider>
      </SidebarInset>
    </SidebarProvider>
  )
}
