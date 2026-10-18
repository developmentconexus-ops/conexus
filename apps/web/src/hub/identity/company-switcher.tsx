import type { CompanyId } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronsUpDownIcon } from 'lucide-react'
import { Button } from '../../ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { companiesQuery } from './queries.ts'

/**
 * The head of the rail inside a company: its name, and the other companies of the person to go to.
 * Alone in one company there is nothing to switch to, so nothing is shown.
 */
export function CompanySwitcher({ current }: { current: CompanyId }) {
  const { data } = useQuery({ ...companiesQuery(undefined), refetchOnMount: false })
  const here = data?.companies.find(({ company }) => company.id === current)
  if (data === undefined || here === undefined || data.companies.length < 2) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="w-full justify-between" />}
        aria-label={`Trocar de empresa. Agora: ${here.company.name}`}
      >
        <span className="truncate">{here.company.name}</span>
        <ChevronsUpDownIcon aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-(--anchor-width)">
        <DropdownMenuGroup>
          {data.companies.map(({ company }) => (
            <DropdownMenuLinkItem
              key={company.id}
              render={
                <Link to="/companies/$companyId/projects" params={{ companyId: company.id }} />
              }
            >
              <span className="truncate">{company.name}</span>
            </DropdownMenuLinkItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLinkItem render={<Link to="/" />}>Suas empresas</DropdownMenuLinkItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
