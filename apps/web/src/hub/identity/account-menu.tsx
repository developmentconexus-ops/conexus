import type { Person } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { BuildingIcon, ChevronsUpDownIcon, LogOutIcon } from 'lucide-react'
import { sentenceOf } from '../../platform/hub.ts'
import { THEME_LABELS, ThemeChoice, useTheme } from '../../platform/theme.ts'
import { Avatar, AvatarFallback } from '../../ui/avatar.tsx'
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
import { companiesQuery } from './queries.ts'
import { useSignOut } from './sign-out.ts'

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}

/** The account, at the foot of the sidebar: who is in, the theme, the Central and "Sair" (W30). */
export function AccountMenu({ person }: { person: Person }) {
  const { isMobile } = useSidebar()
  const { choice, choose } = useTheme()
  const signOut = useSignOut()
  // The installation's role comes with the company list, read once more only when it changes;
  // without the role the link is not offered.
  const { data: companies } = useQuery({ ...companiesQuery(undefined), refetchOnMount: false })

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="px-0" />}
            aria-label={`Conta de ${person.name}`}
          >
            <Avatar className="size-8">
              <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
            </Avatar>
            <span className="grid min-w-0 flex-1 text-left">
              <span className="truncate text-text">{person.name}</span>
              <span className="truncate text-fact text-text-2">{person.email}</span>
            </span>
            <ChevronsUpDownIcon aria-hidden="true" className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side={isMobile ? 'top' : 'right'}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <span className="truncate text-text">{person.name}</span>
                <span className="truncate text-label text-text-2">{person.email}</span>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-eyebrow text-text-2 uppercase">
                Tema
              </DropdownMenuLabel>
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
                <p role="alert" className="px-sm py-xs text-label text-danger">
                  {sentenceOf(signOut.error)}
                </p>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
