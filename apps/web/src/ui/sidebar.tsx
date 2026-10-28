import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import type { ComponentProps, ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { touchArea } from './button.tsx'
import { cn } from './cn.ts'
import { Input } from './input.tsx'
import { Sheet, SheetContent } from './sheet.tsx'
import { Skeleton } from './skeleton.tsx'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip.tsx'
import { useIsMobile } from './use-mobile.ts'

// Copied from shadcn's base-nova `sidebar` (CLI 4.22.1), keeping the parts the frames use. Its
// widths are the brand's container tokens instead of a `style` attribute (design V17); it keeps no
// cookie, the frame decides when it opens; the phone drawer is the brand's `sheet` (V56); its
// places are `nav-item` with 18px icons (V34); the transitions stop under reduced motion (V26).

const SHORTCUT = 'b'

type SidebarContextValue = {
  state: 'expanded' | 'collapsed'
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext)
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider.')
  return context
}

export function SidebarProvider({
  open,
  onOpenChange,
  className,
  children,
  ...props
}: ComponentProps<'div'> & { open: boolean; onOpenChange: (open: boolean) => void }) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = useState(false)

  const toggleSidebar = useCallback(() => {
    if (isMobile) setOpenMobile((value) => !value)
    else onOpenChange(!open)
  }, [isMobile, open, onOpenChange])

  // Ctrl+B or Cmd+B opens and closes the sidebar, as shadcn's does.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggleSidebar()
      }
    }
    globalThis.addEventListener('keydown', onKeyDown)
    return () => globalThis.removeEventListener('keydown', onKeyDown)
  }, [toggleSidebar])

  const value = useMemo<SidebarContextValue>(
    () => ({
      state: open ? 'expanded' : 'collapsed',
      open,
      setOpen: onOpenChange,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [open, onOpenChange, isMobile, openMobile, toggleSidebar],
  )

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-wrapper"
        className={cn('group/sidebar-wrapper flex min-h-dvh w-full bg-canvas', className)}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

/** The sidebar: a column that becomes icons when closed, or the drawer on a phone. */
export function Sidebar({ label, children }: { label: string; children: ReactNode }) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent title={label} data-sidebar="sidebar" data-mobile="true">
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer hidden text-text md:block"
      data-state={state}
      data-collapsible={state === 'collapsed' ? 'icon' : ''}
      data-slot="sidebar"
    >
      {/* Holds the sidebar's width in the page, under the fixed column. */}
      <div
        data-slot="sidebar-gap"
        className="relative w-sidebar transition-[width] duration-200 ease-linear group-data-[collapsible=icon]:w-sidebar-icon motion-reduce:transition-none"
      />
      <nav
        aria-label={label}
        data-slot="sidebar-container"
        className="fixed inset-y-0 left-0 z-10 hidden h-dvh w-sidebar border-r border-line bg-surface transition-[width] duration-200 ease-linear group-data-[collapsible=icon]:w-sidebar-icon motion-reduce:transition-none md:flex"
      >
        <div data-sidebar="sidebar" className="flex size-full flex-col">
          {children}
        </div>
      </nav>
    </div>
  )
}

/** The thin edge beside the sidebar that opens and closes it with the mouse. */
export function SidebarRail() {
  const { toggleSidebar, open } = useSidebar()
  const label = open ? 'Recolher a barra lateral' : 'Abrir a barra lateral'
  return (
    <button
      type="button"
      data-sidebar="rail"
      aria-label={label}
      title={label}
      tabIndex={-1}
      onClick={toggleSidebar}
      className="absolute inset-y-0 -right-2 z-20 hidden w-4 cursor-w-resize after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-line group-data-[collapsible=icon]:cursor-e-resize md:flex"
    />
  )
}

export function SidebarInset({ className, ...props }: ComponentProps<'main'>) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn('relative flex w-full min-w-0 flex-1 flex-col bg-canvas', className)}
      {...props}
    />
  )
}

export function SidebarInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input data-slot="sidebar-input" className={cn('h-8', className)} {...props} />
}

export function SidebarHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-header"
      className={cn('flex flex-col gap-sm p-sm', className)}
      {...props}
    />
  )
}

export function SidebarFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn('flex flex-col gap-sm p-sm', className)}
      {...props}
    />
  )
}

export function SidebarContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-auto group-data-[collapsible=icon]:overflow-hidden',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn('relative flex w-full min-w-0 flex-col p-sm', className)}
      {...props}
    />
  )
}

export function SidebarGroupLabel({ className, ...props }: ComponentProps<'h2'>) {
  return (
    <h2
      data-slot="sidebar-group-label"
      className={cn(
        'flex min-h-8 shrink-0 items-center px-[0.6rem] py-xs text-eyebrow text-text-2 uppercase group-data-[collapsible=icon]:hidden',
        className,
      )}
      {...props}
    />
  )
}

export function SidebarMenu({ className, ...props }: ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn('flex w-full min-w-0 flex-col gap-xs', className)}
      {...props}
    />
  )
}

export function SidebarMenuItem({ className, ...props }: ComponentProps<'li'>) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn('group/menu-item relative', className)}
      {...props}
    />
  )
}

// The router marks the current place `data-status="active"`; a menu marks its open trigger.
const menuButton = cva(
  'peer/menu-button flex w-full items-center gap-sm overflow-hidden rounded-control px-[0.6rem] text-left font-body text-label text-text-2 hover:bg-accent-soft hover:text-text data-popup-open:bg-surface-3 data-[status=active]:bg-surface-3 data-[status=active]:text-text group-data-[collapsible=icon]:size-[34px]! group-data-[collapsible=icon]:p-sm! [&_svg]:size-[18px] [&_svg]:shrink-0 [&>span:last-child]:truncate',
  {
    variants: {
      size: {
        default: 'h-[34px]',
        lg: 'h-12 group-data-[collapsible=icon]:p-0!',
      },
    },
    defaultVariants: { size: 'default' },
  },
)

/** A place or a trigger in the sidebar; closed to icons, its label becomes a tooltip. */
export function SidebarMenuButton({
  render,
  size,
  tooltip,
  className,
  ...props
}: useRender.ComponentProps<'button'> &
  ComponentProps<'button'> & { tooltip?: string } & VariantProps<typeof menuButton>) {
  const { isMobile, state } = useSidebar()
  const button = useRender({
    defaultTagName: 'button',
    props: mergeProps<'button'>({ className: cn(menuButton({ size }), className) }, props),
    render: tooltip === undefined ? render : <TooltipTrigger render={render} />,
    state: { slot: 'sidebar-menu-button', size },
  })
  if (tooltip === undefined) return button
  return (
    <Tooltip>
      {button}
      <TooltipContent side="right" hidden={state !== 'collapsed' || isMobile}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

/** A place still loading: a line of skeleton the width of a short name (web W17). */
export function SidebarMenuSkeleton() {
  return (
    <div data-slot="sidebar-menu-skeleton" className="flex h-[34px] items-center px-[0.6rem]">
      <Skeleton className="h-4 w-3/4" />
    </div>
  )
}

export function SidebarTrigger(props: { label: string; children: ReactNode }) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      type="button"
      data-sidebar="trigger"
      aria-label={props.label}
      onClick={toggleSidebar}
      className={cn(
        touchArea,
        'inline-flex size-8 shrink-0 items-center justify-center rounded-control text-text-2 hover:bg-surface-3 hover:text-text [&_svg]:size-3.5',
      )}
    >
      {props.children}
    </button>
  )
}
