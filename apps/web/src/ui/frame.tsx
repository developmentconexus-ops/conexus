import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { MenuIcon, MoonIcon, SunIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { ConexusWordmark } from '../brand/mark.tsx'
import { useTheme } from '../platform/theme.ts'
import { Button } from './button.tsx'
import { cn } from './cn.ts'
import { Sheet, SheetContent, SheetTrigger } from './sheet.tsx'

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

type Place = Pick<LinkProps, 'to' | 'params'> & { icon: LucideIcon; label: string }

/** A place in the rail; the router marks the current one active (design `nav-item`). */
function NavItem(props: { place: Place; icons?: boolean; onClick?: () => void }) {
  const { place } = props
  const Icon = place.icon
  return (
    <Link
      to={place.to}
      params={place.params}
      onClick={props.onClick}
      title={place.label}
      className="flex h-[34px] items-center gap-sm rounded-control px-[0.6rem] text-label text-text-2 hover:bg-accent-soft hover:text-text data-[status=active]:bg-surface-3 data-[status=active]:text-text"
    >
      <Icon aria-hidden="true" className="size-[18px]" />
      <span className={props.icons ? 'md:sr-only' : undefined}>{place.label}</span>
    </Link>
  )
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const label = theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'
  return (
    <Button variant="ghost" size="icon" aria-label={label} title={label} onClick={toggle}>
      {theme === 'dark' ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
    </Button>
  )
}

/**
 * The frame of every page with a session: a top bar with the mark, the place, the theme and the
 * account; a rail on wide screens that becomes a drawer on a phone (design V1, V56). The switcher,
 * when there is one, heads the rail and the drawer. In a Projeto (`workspace`) the rail shrinks to
 * its icons and the page fills the rest edge to edge, for the Projeto's two regions.
 */
export function Frame(props: {
  place: string
  places: readonly Place[]
  switcher?: ReactNode
  account: ReactNode
  workspace?: boolean
  children: ReactNode
}) {
  // Controlled, so a place in the drawer stays a link and still closes the drawer when followed.
  const [drawerOpen, setDrawerOpen] = useState(false)
  return (
    <div
      className={cn(
        'grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)] bg-canvas',
        props.workspace ? 'h-dvh md:grid-cols-[3.5rem_1fr]' : 'min-h-dvh md:grid-cols-[14rem_1fr]',
      )}
    >
      <header className="flex h-14 items-center gap-sm border-b border-line bg-surface px-lg md:col-span-2 md:gap-md">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" />}
            aria-label="Abrir navegação"
          >
            <MenuIcon aria-hidden="true" />
          </SheetTrigger>
          <SheetContent title="Navegação">
            {props.switcher}
            <nav className="flex flex-col gap-xs">
              {props.places.map((place) => (
                <NavItem key={place.label} place={place} onClick={() => setDrawerOpen(false)} />
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <ConexusWordmark arrive word="md" />
        <p className="truncate text-text-2">{props.place}</p>
        <div className="ml-auto flex items-center gap-sm">
          <ThemeToggle />
          {props.account}
        </div>
      </header>
      <div
        className={cn(
          'hidden flex-col gap-md border-r border-line bg-surface p-md md:flex',
          props.workspace && 'p-sm',
        )}
      >
        {!props.workspace && props.switcher}
        <nav aria-label="Navegação" className="flex flex-col gap-xs">
          {props.places.map((place) => (
            <NavItem key={place.label} place={place} icons={props.workspace} />
          ))}
        </nav>
      </div>
      <main className={cn('min-w-0', props.workspace ? 'min-h-0' : 'p-xl')}>{props.children}</main>
    </div>
  )
}
