import { Link } from '@tanstack/react-router'
import { BuildingIcon } from 'lucide-react'
import {
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
} from '../../ui/dropdown-menu.tsx'
import { SidebarSelector } from '../../ui/sidebar.tsx'
import { useCompanies } from '../identity/public.ts'

/**
 * The head of the Central's sidebar: its name, and "Ir para uma empresa" with the operator's own
 * companies, when they have any (web W29).
 */
export function CentralHeader() {
  const { data } = useCompanies()
  const hasCompanies = data !== undefined && data.companies.length > 0
  return (
    <SidebarSelector icon={<BuildingIcon />} title="Central" label="Central. Ir para uma empresa">
      {hasCompanies ? (
        <DropdownMenuGroup>
          <DropdownMenuLabel>Ir para uma empresa</DropdownMenuLabel>
          {data.companies.map((row) => (
            <DropdownMenuLinkItem
              key={row.company.id}
              render={<Link to="/companies/$companyId" params={{ companyId: row.company.id }} />}
            >
              <span className="truncate">{row.company.name}</span>
            </DropdownMenuLinkItem>
          ))}
        </DropdownMenuGroup>
      ) : undefined}
    </SidebarSelector>
  )
}
