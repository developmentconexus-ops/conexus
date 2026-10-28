import type { CompanyId, Member } from '@conexus/hub-api'
import { ROLE_LABELS, Role } from '@conexus/hub-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useId, useState } from 'react'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { Field, FieldLabel } from '../../ui/field.tsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select.tsx'
import { changePersonRole, forgetCompany, removePerson } from './queries.ts'

const UNCONFIRMED = 'Não confirmamos a mudança. Veja a lista.'

/** What a failed write says: a refusal the Hub settled in its words, any other as one that may have saved. */
function refusalText(error: unknown): string {
  return error instanceof HubFailure && !error.outcomeUnknown ? sentenceOf(error) : UNCONFIRMED
}

/** The Hub no longer knows the person or the company: the dialog closes and the lists are read again. */
function isGone(error: unknown): boolean {
  return error instanceof HubFailure && error.code === 'NOT_FOUND'
}

function invitationsNote(count: number, who: string): string {
  if (count === 0) return ''
  if (count === 1) return ` O convite que ${who} enviou será cancelado.`
  return ` Os ${count} convites que ${who} enviou serão cancelados.`
}

type Write = { isPending: boolean; error: unknown; isError: boolean; reset: () => void }

/** A confirmation: what it asks, the write's refusal, and the two buttons that answer it. */
function ActionDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: { label: string; name: string; danger: boolean }
  title: string
  description: string
  confirm: { label: string; pending: string; disabled?: boolean }
  write: Write
  onConfirm: () => void
  children?: ReactNode
}) {
  const { write, trigger } = props
  function changeOpen(open: boolean) {
    write.reset()
    props.onOpenChange(open)
  }
  return (
    <AlertDialog open={props.open} onOpenChange={changeOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant={trigger.danger ? 'danger' : 'default'}
            size="sm"
            aria-label={trigger.name}
          />
        }
      >
        {trigger.label}
      </AlertDialogTrigger>
      <AlertDialogContent title={props.title} description={props.description}>
        {props.children}
        {write.isError && !isGone(write.error) && (
          <p role="alert" className="text-danger">
            {refusalText(write.error)}
          </p>
        )}
        <div className="flex flex-wrap gap-md">
          <Button
            variant={trigger.danger ? 'danger-confirm' : 'primary'}
            disabled={write.isPending || props.confirm.disabled}
            onClick={props.onConfirm}
          >
            {write.isPending ? props.confirm.pending : props.confirm.label}
          </Button>
          <Button disabled={write.isPending} onClick={() => changeOpen(false)}>
            Cancelar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

type Subject = { companyId: CompanyId; companyName: string; member: Member }

function RemoveMember({ companyId, companyName, member }: Subject) {
  const [open, setOpen] = useState(false)
  const send = useMutation(removePerson)

  function remove() {
    const vars = { params: { companyId, personId: member.personId } }
    send.mutate(vars, {
      onSuccess: () => setOpen(false),
      onError: (error) => isGone(error) && setOpen(false),
    })
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={setOpen}
      trigger={{
        label: 'Tirar da empresa',
        name: `Tirar da empresa: ${member.name}`,
        danger: true,
      }}
      title={`Tirar ${member.name} de ${companyName}?`}
      description={`Perde o acesso agora. A conta continua.${invitationsNote(member.invitationsSent, member.name)}`}
      confirm={{ label: 'Tirar da empresa', pending: 'Tirando…' }}
      write={send}
      onConfirm={remove}
    />
  )
}

function LeaveCompany({ companyId, companyName, member }: Subject) {
  const [open, setOpen] = useState(false)
  const send = useMutation(removePerson)
  const router = useRouter()
  const queryClient = useQueryClient()

  // The company is no longer the person's: its page leaves, and what the cache held of it with it.
  async function left() {
    await router.navigate({ to: '/' })
    forgetCompany(queryClient, companyId)
  }

  function leave() {
    const vars = { params: { companyId, personId: member.personId } }
    send.mutate(vars, { onSuccess: left, onError: (error) => isGone(error) && left() })
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={setOpen}
      trigger={{ label: 'Sair da empresa', name: 'Sair da empresa', danger: true }}
      title={`Sair de ${companyName}?`}
      description={`Você perde o acesso agora.${invitationsNote(member.invitationsSent, 'você')}`}
      confirm={{ label: 'Sair da empresa', pending: 'Saindo…' }}
      write={send}
      onConfirm={leave}
    />
  )
}

function ChangeRole({ companyId, member }: Pick<Subject, 'companyId' | 'member'>) {
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<Role>(member.role)
  const send = useMutation(changePersonRole)
  const id = useId()
  // The current role is on offer so it shows marked; the Hub's list says which others.
  const roles = Role.options.filter(
    (role) => role === member.role || member.mayChangeTo.includes(role),
  )
  const role = roles.includes(picked) ? picked : member.role

  function change() {
    const vars = {
      params: { companyId, personId: member.personId },
      body: { role, from: member.role },
    }
    send.mutate(vars, {
      onSuccess: () => setOpen(false),
      onError: (error) => isGone(error) && setOpen(false),
    })
  }

  return (
    <ActionDialog
      open={open}
      onOpenChange={setOpen}
      trigger={{ label: 'Mudar papel', name: `Mudar papel: ${member.name}`, danger: false }}
      title={`Mudar o papel de ${member.name}`}
      description={`Papel atual: ${ROLE_LABELS[member.role]}.`}
      confirm={{ label: 'Mudar papel', pending: 'Salvando…', disabled: role === member.role }}
      write={send}
      onConfirm={change}
    >
      <Field>
        <FieldLabel htmlFor={id}>Papel</FieldLabel>
        <Select
          id={id}
          value={role}
          onValueChange={(next) => setPicked(Role.parse(next))}
          items={roles.map((one) => ({ value: one, label: ROLE_LABELS[one] }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((one) => (
              <SelectItem key={one} value={one}>
                {ROLE_LABELS[one]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </ActionDialog>
  )
}

/** What the viewer may do to a person, as the Hub's row says (code C26): nothing it does not offer. */
export function MemberActions(props: Subject & { self: boolean }) {
  const { member, self } = props
  return (
    <>
      {member.mayChangeTo.length > 0 && <ChangeRole {...props} />}
      {member.mayRemove && (self ? <LeaveCompany {...props} /> : <RemoveMember {...props} />)}
    </>
  )
}
