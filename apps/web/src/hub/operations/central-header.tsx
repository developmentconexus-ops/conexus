import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { BuildingIcon, ChevronsUpDownIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '../../ui/sidebar.tsx'
import { companiesQuery } from '../identity/public.ts'

/**
 * The head of the Central's sidebar: its name, and "Ir para uma empresa" with the operator's own
 * companies, when they have any (web W29).
 */
export function CentralHeader() {
  const { isMobile } = useSidebar()
  const { data } = useQuery({ ...companiesQuery(undefined), refetchOnMount: false })
  const name = (
    <>
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-control bg-ink text-on-ink"
      >
        <BuildingIcon />
      </span>
      <span className="truncate font-display text-title text-text">Central de Operação</span>
    </>
  )
  if (data === undefined || data.companies.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem className="flex h-12 items-center gap-sm">{name}</SidebarMenuItem>
      </SidebarMenu>
    )
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<SidebarMenuButton size="lg" className="px-0" />}
            aria-label="Central de Operação. Ir para uma empresa"
          >
            {name}
            <ChevronsUpDownIcon aria-hidden="true" className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side={isMobile ? 'bottom' : 'right'}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-eyebrow text-text-2 uppercase">
                Ir para uma empresa
              </DropdownMenuLabel>
              {data.companies.map((row) => (
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
