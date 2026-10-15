import type { Person } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { LogOutIcon } from 'lucide-react'
import { sentenceOf } from '../../platform/hub.ts'
import { Avatar, AvatarFallback } from '../../ui/avatar.tsx'
import { Button } from '../../ui/button.tsx'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu.tsx'
import { signOut } from './queries.ts'

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
