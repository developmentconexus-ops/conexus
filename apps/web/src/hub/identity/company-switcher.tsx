import type { CompanyId } from '@conexus/hub-api'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
} from '../../ui/dropdown-menu.tsx'
import { SidebarSelector } from '../../ui/sidebar.tsx'
import { companyQuery } from './queries.ts'
import { useCompanies } from './use-companies.ts'

/**
 * The head of the sidebar inside a company: its name, and the person's other companies to switch
 * to, the ones the Hub lists as open to them (web W30). Alone in one company, only its name.
 */
export function CompanySwitcher({ current }: { current: CompanyId }) {
  const { company } = useSuspenseQuery(companyQuery(current)).data
  const { data } = useCompanies()
  const others = data?.companies.filter((row) => row.company.id !== current) ?? []
  return (
    <SidebarSelector
      icon={company.name.trim().charAt(0).toUpperCase()}
      title={company.name}
      label={`Trocar de empresa. Agora: ${company.name}`}
    >
      {others.length === 0 ? undefined : (
        <DropdownMenuGroup>
          <DropdownMenuLabel>Suas empresas</DropdownMenuLabel>
          {data?.companies.map((row) => (
            <DropdownMenuLinkItem
              key={row.company.id}
              render={<Link to="/companies/$companyId" params={{ companyId: row.company.id }} />}
            >
              <span className="truncate">{row.company.name}</span>
            </DropdownMenuLinkItem>
          ))}
        </DropdownMenuGroup>
      )}
    </SidebarSelector>
  )
}
