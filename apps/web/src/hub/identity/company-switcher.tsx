import type { CompanyId } from '@conexus/hub-api'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronsUpDownIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../../ui/sidebar.tsx'
import { companiesQuery, companyQuery } from './queries.ts'

function CompanyBadge({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 shrink-0 items-center justify-center rounded-control bg-ink font-display text-label text-on-ink"
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}

/**
 * The head of the sidebar inside a company: its name, and the person's other companies to switch
 * to, the ones the Hub lists as open to them (web W30). Alone in one company, only its name.
 */
export function CompanySwitcher({ current }: { current: CompanyId }) {
  const { isMobile } = useSidebar()
  const { company } = useSuspenseQuery(companyQuery(current)).data
  const { data } = useQuery({ ...companiesQuery(undefined), refetchOnMount: false })
  const others = data?.companies.filter((row) => row.company.id !== current) ?? []
  const name = (
    <>
      <CompanyBadge name={company.name} />
      <span className="truncate font-display text-title text-text">{company.name}</span>
    </>
  )
  if (others.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem className="flex h-12 items-center gap-sm group-data-[collapsible=icon]:px-0">
          {name}
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="px-0" />}
            aria-label={`Trocar de empresa. Agora: ${company.name}`}
          >
            {name}
            <ChevronsUpDownIcon aria-hidden="true" className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side={isMobile ? 'bottom' : 'right'}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-eyebrow text-text-2 uppercase">
                Suas empresas
              </DropdownMenuLabel>
              {data?.companies.map((row) => (
                <DropdownMenuLinkItem
                  key={row.company.id}
                  render={
                    <Link to="/companies/$companyId" params={{ companyId: row.company.id }} />
                  }
                >
                  <span className="truncate">{row.company.name}</span>
                </DropdownMenuLinkItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
