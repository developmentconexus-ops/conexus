import type { CompanyId, ListedInvitation } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'
import { Button } from '../../ui/button.tsx'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { cancelCompanyInvitation } from './queries.ts'

/** Cancels an open invitation once the person types its e-mail back (step 4.1). */
export function CancelInvitationForm({
  companyId,
  invitation,
  onClose,
}: {
  companyId: CompanyId
  invitation: Pick<ListedInvitation, 'id' | 'email' | 'revision'>
  onClose: () => void
}) {
  const cancel = useMutation(cancelCompanyInvitation)
  const form = useSchemaForm(z.object({ email: z.literal(invitation.email) }), { email: '' })
  async function submit() {
    try {
      await cancel.mutateAsync({
        params: { companyId, invitationId: invitation.id },
        body: { revision: invitation.revision },
      })
      onClose()
    } catch (error) {
      setServerError(form, error)
    }
  }
  return (
    <Form form={form} onSubmit={submit}>
      <p className="break-all">Para cancelar, confirme {invitation.email}.</p>
      <TextField
        name="email"
        type="email"
        label="Confirmar e-mail"
        autoComplete="off"
        invalid="Digite o e-mail do convite."
      />
      <FormAlert />
      <SubmitButton
        idle="Confirmar cancelamento"
        pending="Cancelando…"
        label={`Confirmar cancelamento de convite para ${invitation.email}`}
      />
      <Button
        type="button"
        aria-label={`Voltar sem cancelar convite para ${invitation.email}`}
        disabled={cancel.isPending}
        onClick={onClose}
      >
        Voltar
      </Button>
    </Form>
  )
}
