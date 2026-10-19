import type { CompanyId, ModelAccount } from '@conexus/hub-api'
import { ACCOUNT_LABEL_MAX_LENGTH } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useId, useRef, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { FieldError } from '../../ui/field.tsx'
import { Input } from '../../ui/input.tsx'
import { Label } from '../../ui/label.tsx'
import { sendChange } from './queries.ts'
import { refusalText } from './text.ts'

/** The new name of an account, at the revision the person read; the field takes focus as it opens. */
export function RenameForm(props: {
  companyId: CompanyId
  account: ModelAccount
  onClose: () => void
}) {
  const { companyId, account } = props
  const [label, setLabel] = useState(account.label)
  const send = useMutation(sendChange)
  const field = useRef<HTMLInputElement>(null)
  const id = useId()
  useEffect(() => field.current?.focus(), [])

  function save() {
    send.mutate(
      {
        params: { companyId, accountId: account.id },
        body: { revision: account.revision, label: label.trim() },
      },
      { onSuccess: props.onClose },
    )
  }

  return (
    <form
      className="flex basis-full flex-col gap-sm"
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
      onKeyDown={(event) => event.key === 'Escape' && props.onClose()}
    >
      <Label htmlFor={id}>{`Novo nome de ${account.label}`}</Label>
      <Input
        id={id}
        ref={field}
        value={label}
        maxLength={ACCOUNT_LABEL_MAX_LENGTH}
        autoComplete="off"
        onChange={(event) => setLabel(event.target.value)}
      />
      <FieldError>{send.isError ? refusalText(send.error) : undefined}</FieldError>
      <div className="flex flex-wrap gap-md">
        <Button
          type="submit"
          variant="primary"
          disabled={send.isPending || label.trim() === '' || label.trim() === account.label}
        >
          {send.isPending ? 'Salvando…' : 'Salvar nome'}
        </Button>
        <Button type="button" disabled={send.isPending} onClick={props.onClose}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
