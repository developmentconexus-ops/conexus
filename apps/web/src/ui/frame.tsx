import type { LinkProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import type { LucideIcon } from 'lucide-react'
import { MenuIcon, MoonIcon, SunIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ConexusWordmark } from '../brand/mark.tsx'
import { useTheme } from '../platform/theme.ts'
import { Button } from './button.tsx'
import { Sheet, SheetClose, SheetContent, SheetTrigger } from './sheet.tsx'

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

type Place = { to: LinkProps['to']; icon: LucideIcon; label: string }

/** A place in the rail; the router marks the current one active (design `nav-item`). */
function NavItem({ place, ...props }: { place: Place } & Omit<LinkProps, 'to' | 'children'>) {
  const Icon = place.icon
  return (
    <Link
      {...props}
      to={place.to}
      className="flex h-[34px] items-center gap-sm rounded-control px-[0.6rem] text-label text-text-2 hover:bg-accent-soft hover:text-text data-[status=active]:bg-surface-3 data-[status=active]:text-text"
    >
      <Icon aria-hidden="true" className="size-[18px]" />
      {place.label}
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
 * account; a rail on wide screens that becomes a drawer on a phone (design V1, V56).
 */
export function Frame(props: {
  place: string
  places: readonly Place[]
  account: ReactNode
  children: ReactNode
}) {
  return (
    <div className="grid min-h-dvh grid-cols-1 grid-rows-[auto_1fr] bg-canvas md:grid-cols-[14rem_1fr]">
      <header className="flex h-14 items-center gap-sm border-b border-line bg-surface px-lg md:col-span-2 md:gap-md">
        <Sheet>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" />}
            aria-label="Abrir navegação"
          >
            <MenuIcon aria-hidden="true" />
          </SheetTrigger>
          <SheetContent title="Navegação">
            <nav className="flex flex-col gap-xs">
              {props.places.map((place) => (
                <SheetClose
                  key={place.label}
                  nativeButton={false}
                  render={<NavItem place={place} />}
                />
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
      <nav
        aria-label="Navegação"
        className="hidden flex-col gap-xs border-r border-line bg-surface p-md md:flex"
      >
        {props.places.map((place) => (
          <NavItem key={place.label} place={place} />
        ))}
      </nav>
      <main className="min-w-0 p-xl">{props.children}</main>
    </div>
  )
}
