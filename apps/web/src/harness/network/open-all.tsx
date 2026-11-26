import type { CompanyId, CompanyNetworkOpen } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { dayOf } from '../../platform/dates.ts'
import { unconfirmedText, writeFailureText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { AlertDialog, AlertDialogContent } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { SettingsSection } from '../../ui/settings-section.tsx'
import { Switch } from '../../ui/switch.tsx'
import { closeAllNetworkMutation, openAllNetworkMutation, openAllNetworkQuery } from './queries.ts'

const UNCONFIRMED = unconfirmedText('a mudança', 'Veja o estado.')
const WARNING =
  'Com a internet toda, as máquinas dos agentes alcançam qualquer site. Um agente que leu dado da empresa pode ser enganado pelo texto de uma página e mandar esse dado para fora. A lista de domínios deixa de ser a trava.'

function stateOf(open: CompanyNetworkOpen | null): string {
  if (open === null) return 'Desligada'
  const day = dayOf(open.openedAt)
  return open.openedBy === null ? `Ligada em ${day}` : `Ligada por ${open.openedBy} em ${day}`
}

function TurnOn(props: { companyId: CompanyId; open: boolean; onClose: () => void }) {
  const send = useMutation(openAllNetworkMutation)
  function close() {
    send.reset()
    props.onClose()
  }
  return (
    <AlertDialog open={props.open} onOpenChange={close}>
      <AlertDialogContent title="Ligar a internet toda?" description={WARNING}>
        {send.isError && <Alert tone="danger">{writeFailureText(send.error, UNCONFIRMED)}</Alert>}
        <div className="flex flex-wrap gap-md">
          <Button
            variant="primary"
            disabled={send.isPending}
            onClick={() =>
              send.mutate({ params: { companyId: props.companyId } }, { onSuccess: close })
            }
          >
            {send.isPending ? 'Ligando…' : 'Ligar internet toda'}
          </Button>
          <Button disabled={send.isPending} onClick={close}>
            Cancelar
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function OpenAll({ companyId, may }: { companyId: CompanyId; may: boolean }) {
  const { open } = useSuspenseQuery(openAllNetworkQuery(companyId)).data
  const turnOff = useMutation(closeAllNetworkMutation)
  const [asking, setAsking] = useState(false)
  return (
    <SettingsSection
      id="open-all"
      title="Internet toda"
      description="As máquinas alcançam qualquer site, sem cartão."
    >
      <div className="flex items-center gap-md">
        {may && (
          <Switch
            aria-labelledby="open-all-title"
            checked={open !== null}
            disabled={turnOff.isPending}
            onCheckedChange={(on) =>
              on ? setAsking(true) : turnOff.mutate({ params: { companyId } })
            }
          />
        )}
        <p>{stateOf(open)}</p>
      </div>
      {!may && <p className="text-text-2">Só o dono liga a internet toda.</p>}
      {turnOff.isError && (
        <Alert tone="danger">{writeFailureText(turnOff.error, UNCONFIRMED)}</Alert>
      )}
      {may && <TurnOn companyId={companyId} open={asking} onClose={() => setAsking(false)} />}
    </SettingsSection>
  )
}
