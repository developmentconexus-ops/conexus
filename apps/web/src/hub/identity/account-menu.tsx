import type { Person } from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from '@tanstack/react-router'
import { BuildingIcon, LogOutIcon } from 'lucide-react'
import { sentenceOf } from '../../platform/hub.ts'
import { Avatar, AvatarFallback } from '../../ui/avatar.tsx'
import { Button } from '../../ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { companiesQuery, signOut } from './queries.ts'

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/)
  const first = words[0]?.[0] ?? ''
  const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}

export function AccountMenu({ person }: { person: Person }) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const send = useMutation(signOut)
  // The installation's role comes with the company list, read once more only when it changes;
  // without the role the link is not offered.
  const { data: companies } = useQuery({ ...companiesQuery(undefined), refetchOnMount: false })

  function leave() {
    send.mutate(undefined, {
      onSuccess: async () => {
        // Leaving first, so no screen of the frame reads again into an emptied cache (web W28).
        await router.navigate({ to: '/login', search: { reason: 'signed-out' } })
        queryClient.clear()
      },
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="rounded-pill" />}
        aria-label={`Conta de ${person.name}`}
      >
        <Avatar>
          <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="truncate text-text">{person.name}</span>
            <span className="truncate text-label text-text-2">{person.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {companies?.mayOperate && (
          <DropdownMenuGroup>
            <DropdownMenuLinkItem render={<Link to="/operations/clients" />}>
              <BuildingIcon aria-hidden="true" />
              Central de Operação
            </DropdownMenuLinkItem>
          </DropdownMenuGroup>
        )}
        <DropdownMenuGroup>
          <DropdownMenuItem closeOnClick={false} disabled={send.isPending} onClick={leave}>
            <LogOutIcon aria-hidden="true" />
            {send.isPending ? 'Saindo…' : 'Sair do Conexus'}
          </DropdownMenuItem>
          {send.isError && (
            <p role="alert" className="px-sm py-xs text-label text-danger">
              {sentenceOf(send.error)}
            </p>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
