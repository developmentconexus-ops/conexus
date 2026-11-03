import type { Person } from '@conexus/hub-api'
import { Link } from '@tanstack/react-router'
import { BuildingIcon, ChevronsUpDownIcon, LogOutIcon } from 'lucide-react'
import { sentenceOf } from '../../platform/hub.ts'
import { THEME_LABELS, ThemeChoice, useTheme } from '../../platform/theme.ts'
import { Alert } from '../../ui/alert.tsx'
import { Avatar, AvatarFallback } from '../../ui/avatar.tsx'
import { cn } from '../../ui/cn.ts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../../ui/sidebar.tsx'
import { useSignOut } from './sign-out.ts'
import { useCompanies } from './use-companies.ts'

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}

/**
 * The account, at the foot of the sidebar: who is in, the theme, the Central and "Sair" (W30).
 * `compact` is the rail's: the avatar alone in a 40px tile, its menu opening to the right.
 */
export function AccountMenu({ person, compact = false }: { person: Person; compact?: boolean }) {
  const { isMobile } = useSidebar()
  const { choice, choose } = useTheme()
  const signOut = useSignOut()
  // The installation's role comes with the company list, read once more only when it changes;
  // without the role the link is not offered.
  const { data: companies } = useCompanies()

  return (
    <SidebarMenu className={cn(compact && 'items-center')}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              compact ? (
                <button
                  type="button"
                  className="flex size-10 shrink-0 items-center justify-center rounded-control hover:bg-surface-3 data-popup-open:bg-surface-4 pointer-coarse:relative pointer-coarse:after:absolute pointer-coarse:after:top-1/2 pointer-coarse:after:left-1/2 pointer-coarse:after:size-11 pointer-coarse:after:-translate-1/2"
                />
              ) : (
                <SidebarMenuButton size="lg" className="px-0" />
              )
            }
            aria-label={`Conta de ${person.name}`}
          >
            <Avatar className="size-8">
              <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
            </Avatar>
            {!compact && (
              <>
                <span className="grid min-w-0 flex-1 text-left">
                  <span className="truncate text-label text-text">{person.name}</span>
                  <span className="truncate text-fact text-text-2">{person.email}</span>
                </span>
                <ChevronsUpDownIcon aria-hidden="true" className="ml-auto" />
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side={isMobile && !compact ? 'top' : 'right'}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <span className="truncate text-label text-text">{person.name}</span>
                <span className="truncate text-label text-text-2">{person.email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Tema</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={choice}
                onValueChange={(value: unknown) => choose(ThemeChoice.parse(value))}
              >
                {ThemeChoice.options.map((value) => (
                  <DropdownMenuRadioItem key={value} value={value} closeOnClick={false}>
                    {THEME_LABELS[value]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {companies?.mayOperate && (
              <DropdownMenuGroup>
                <DropdownMenuLinkItem render={<Link to="/operations" />}>
                  <BuildingIcon aria-hidden="true" />
                  Central
                </DropdownMenuLinkItem>
              </DropdownMenuGroup>
            )}
            <DropdownMenuGroup>
              <DropdownMenuItem
                closeOnClick={false}
                disabled={signOut.pending}
                onClick={signOut.leave}
              >
                <LogOutIcon aria-hidden="true" />
                {signOut.pending ? 'Saindo…' : 'Sair do Conexus'}
              </DropdownMenuItem>
              {signOut.error !== undefined && (
                <Alert tone="danger" className="px-sm py-xs">
                  {sentenceOf(signOut.error)}
                </Alert>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
