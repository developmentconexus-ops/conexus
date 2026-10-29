import type { AppAccessList, CompanyId, FailureCode, ProjectId } from '@conexus/hub-api'
import { inviteToApp } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { dayAndHour, dayAndMonth } from '../../platform/dates.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { SectionTitle } from '../../ui/list.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { NotFound, ReadFailure } from '../../ui/states.tsx'
import { FramedTable, TableBody, TableCell, TableRow } from '../../ui/table.tsx'
import { useIsMobile } from '../../ui/use-mobile.ts'
import { ActionDialog, InviteFields, isGone } from '../identity/public.ts'
import {
  appAccessQuery,
  sendAppInvitation,
  sendAppInvitationCancel,
  sendAppRevocation,
  sendAppRole,
} from './queries.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }
type Roles = AppAccessList['roles']

const COLUMNS = [
  { name: 'Pessoa' },
  { name: 'Papel', leavesOnPhone: true, width: 'lg:w-52' },
  { name: 'Ações', leavesOnPhone: true, width: 'lg:w-40' },
]

function labelOf(roles: Roles, name: string | null): string {
  if (name === null) return 'Usa o app'
  return roles.find((role) => role.name === name)?.label ?? name
}

/** The three cells of a row on a computer; on a phone the role and the actions move under the name. */
function Cells(props: { main: string; under: string; holds: ReactNode; actions: ReactNode }) {
  const phone = useIsMobile()
  return (
    <>
      <TableCell className="whitespace-normal px-sm">
        <span className="flex flex-col gap-xs">
          <span className="wrap-anywhere">{props.main}</span>
          <span className="wrap-anywhere text-label text-text-2">{props.under}</span>
          {phone && props.holds}
          {phone && <span className="flex flex-col items-stretch gap-sm">{props.actions}</span>}
        </span>
      </TableCell>
      {!phone && <TableCell className="whitespace-normal px-sm">{props.holds}</TableCell>}
      {!phone && (
        <TableCell className="px-sm">
          <span className="flex items-center gap-sm">{props.actions}</span>
        </TableCell>
      )}
    </>
  )
}

function RoleSelect(props: {
  name: string
  roles: Roles
  value: string | null
  onPick: (role: string) => void
  disabled: boolean
}) {
  return (
    <Select
      value={props.value}
      onValueChange={(next) => next !== null && props.onPick(next)}
      items={props.roles.map((role) => ({ value: role.name, label: role.label }))}
      disabled={props.disabled}
    >
      <SelectTrigger aria-label={`Papel de ${props.name}`}>
        <SelectValue placeholder="Escolha um papel" />
      </SelectTrigger>
      <SelectContent>
        {props.roles.map((role) => (
          <SelectItem key={role.name} value={role.name}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function Refusal({ error }: { error: unknown }) {
  const phone = useIsMobile()
  if (error === null) return null
  return (
    <TableRow>
      <TableCell colSpan={phone ? 1 : 3} className="whitespace-normal px-sm py-sm">
        <p role="alert" className="text-label text-danger">
          {sentenceOf(error)}
        </p>
      </TableCell>
    </TableRow>
  )
}

function PersonRow(
  props: Scope & { person: AppAccessList['people'][number]; list: AppAccessList },
) {
  const { person, list, companyId, projectId } = props
  const [open, setOpen] = useState(false)
  const change = useMutation(sendAppRole)
  const revoke = useMutation(sendAppRevocation)
  const params = { companyId, projectId, personId: person.personId }
  const managed = list.mayManage && list.roles.length > 0
  let role: ReactNode = labelOf(list.roles, person.role)
  if (managed) {
    role = (
      <span className="flex flex-col gap-xs">
        <RoleSelect
          name={person.name}
          roles={list.roles}
          value={person.roleDeclared ? person.role : null}
          disabled={change.isPending}
          onPick={(next) => change.mutate({ params, body: { role: next } })}
        />
        {!person.roleDeclared && (
          <span className="text-label text-danger">Papel que a versão publicada não tem mais</span>
        )}
        {change.isSuccess && (
          <span role="status" className="text-label text-fact">
            Salvo
          </span>
        )}
      </span>
    )
  } else if (!person.roleDeclared && list.roles.length > 0) {
    role = <span className="text-danger">Papel que a versão publicada não tem mais</span>
  }
  return (
    <>
      <TableRow>
        <Cells
          main={person.name}
          under={`${person.email} · desde ${dayAndMonth(person.grantedAt)}`}
          holds={role}
          actions={
            list.mayManage && (
              <ActionDialog
                open={open}
                onOpenChange={setOpen}
                trigger={{
                  label: 'Tirar acesso',
                  name: `Tirar acesso: ${person.name}`,
                  danger: true,
                }}
                title={`Tirar o acesso de ${person.name}?`}
                description="O próximo clique no app é recusado."
                confirm={{ label: 'Tirar acesso', pending: 'Tirando…' }}
                write={revoke}
                onConfirm={() =>
                  revoke.mutate(
                    { params },
                    {
                      onSuccess: () => setOpen(false),
                      onError: (e) => isGone(e) && setOpen(false),
                    },
                  )
                }
              />
            )
          }
        />
      </TableRow>
      <Refusal error={change.error} />
    </>
  )
}

function InvitationRow(
  props: Scope & { invitation: AppAccessList['invitations'][number]; list: AppAccessList },
) {
  const { invitation, list, companyId, projectId } = props
  const cancel = useMutation(sendAppInvitationCancel)
  return (
    <>
      <TableRow>
        <Cells
          main={invitation.email}
          under={`convite pendente · vence ${dayAndHour(invitation.expiresAt)}`}
          holds={labelOf(list.roles, invitation.role)}
          actions={
            list.mayManage && (
              <Button
                size="sm"
                aria-label={`Cancelar convite para ${invitation.email}`}
                disabled={cancel.isPending}
                onClick={() =>
                  cancel.mutate({ params: { companyId, projectId, invitationId: invitation.id } })
                }
              >
                {cancel.isPending ? 'Cancelando…' : 'Cancelar convite'}
              </Button>
            )
          }
        />
      </TableRow>
      <Refusal error={cancel.error} />
    </>
  )
}

const FIELD_OF: Partial<Record<FailureCode, 'email' | 'role'>> = {
  APP_ACCESS_MEMBER: 'email',
  APP_ACCESS_EXISTS: 'email',
  MAIL_BOUNCED: 'email',
  APP_ROLE_UNKNOWN: 'role',
}

/** "Dar acesso": the e-mail, and the role among the published version's when it declares any. */
function GiveAccess({ companyId, projectId, roles }: Scope & { roles: Roles }) {
  const send = useMutation(sendAppInvitation)
  return (
    <div className="flex w-full max-w-column flex-col gap-lg">
      <InviteFields
        schema={inviteToApp.input.body}
        defaults={{ email: '', role: roles[0]?.name ?? null }}
        options={roles.map((role) => ({ value: role.name, label: role.label }))}
        fieldOf={FIELD_OF}
        send={async (values, attemptKey) =>
          (await send.mutateAsync({ params: { companyId, projectId }, body: values, attemptKey }))
            .invitation
        }
        idle="Dar acesso"
      />
    </div>
  )
}

function Loading() {
  return (
    <div className="flex flex-col gap-md">
      <span className="sr-only" role="status">
        Carregando quem usa o app…
      </span>
      <Skeleton className="h-12" />
      <Skeleton className="h-12" />
    </div>
  )
}

/** Quem usa o app: members as builders, the people given the app with their role, the open invitations, and the form for whoever manages. */
export function Access(scope: Scope) {
  const read = useQuery(appAccessQuery(scope.companyId, scope.projectId))
  const list = read.data
  if (read.error instanceof HubFailure && read.error.code === 'NOT_FOUND') return <NotFound />
  return (
    <section className="flex w-full flex-col gap-lg">
      <SectionTitle>Quem usa o app</SectionTitle>
      {read.isPending && <Loading />}
      {read.isError && (
        <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
      )}
      {list !== undefined && (
        <>
          {!list.mayManage && (
            <p className="text-text-2">Só o dono ou um administrador dá ou tira acesso ao app.</p>
          )}
          <FramedTable aria-label="Quem usa o app" columns={COLUMNS}>
            <TableBody>
              {list.members.map((member) => (
                <TableRow key={member.personId}>
                  <Cells
                    main={member.name}
                    under={member.email}
                    holds="Todos os papéis"
                    actions={null}
                  />
                </TableRow>
              ))}
              {list.people.map((person) => (
                <PersonRow key={person.personId} {...scope} person={person} list={list} />
              ))}
              {list.invitations.map((invitation) => (
                <InvitationRow key={invitation.id} {...scope} invitation={invitation} list={list} />
              ))}
            </TableBody>
          </FramedTable>
          {list.mayManage && !list.published && (
            <p className="text-text-2">Publique o app para dar acesso a alguém.</p>
          )}
          {list.mayManage && list.published && <GiveAccess {...scope} roles={list.roles} />}
        </>
      )}
    </section>
  )
}
