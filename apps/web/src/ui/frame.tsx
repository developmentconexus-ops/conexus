import type { LinkProps } from '@tanstack/react-router'
import { Link, useMatches, useRouter } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { MenuIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { ConexusWordmark } from '../brand/mark.tsx'
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
    <main className="grid min-h-dvh place-items-center bg-canvas p-lg">
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
function PhoneTop() {
  const place = useMatches({
    select: (matches) => {
      const shown = matches.at(-1)?.staticData
      return shown?.place ?? shown?.section?.label
    },
  })
  return (
    <header className="flex h-14 items-center gap-sm border-b border-line bg-surface px-lg md:hidden">
      <SidebarTrigger label="Abrir navegação">
        <MenuIcon aria-hidden="true" />
      </SidebarTrigger>
      <ConexusWordmark word="md" />
      {place !== undefined && <p className="truncate text-text-2">{place}</p>}
    </header>
  )
}

/** Following a link in the drawer closes it (V56): the drawer closes once a navigation resolves. */
function CloseOnNavigation() {
  const { setOpenMobile } = useSidebar()
  const router = useRouter()
  useEffect(
    () => router.subscribe('onResolved', () => setOpenMobile(false)),
    [router, setOpenMobile],
  )
  return null
}

/**
 * The frame of every page with a session (web W30): one sidebar on the left and no top bar. The
 * sidebar holds `header`, `nav` and `footer`; `compact` closes it to icons, and it opens again when
 * `compact` ends. On a phone it is a drawer under a top line naming the place (design V56).
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
  if (compact !== props.compact) {
    setCompact(props.compact)
    setOpen(!props.compact)
  }
  return (
    <SidebarProvider open={open} onOpenChange={setOpen}>
      <Sidebar label="Navegação">
        <SidebarHeader>{props.header}</SidebarHeader>
        <SidebarContent>{props.nav}</SidebarContent>
        <SidebarFooter>{props.footer}</SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <CloseOnNavigation />
      <SidebarInset>
        <PhoneTop />
        <InFrame.Provider value={true}>
          <div className="flex min-w-0 flex-1 flex-col p-xl">{props.children}</div>
        </InFrame.Provider>
      </SidebarInset>
    </SidebarProvider>
  )
}
