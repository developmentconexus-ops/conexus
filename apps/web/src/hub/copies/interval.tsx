import type { CompanyId, CopyInterval, CopySummary } from '@conexus/hub-api'
import { COPY_INTERVAL_DEFAULT, CopyInterval as CopyIntervalSchema } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { writeFailureText } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { Button } from '../../ui/button.tsx'
import { Dialog, DialogContent } from '../../ui/dialog.tsx'
import { ChoiceSelect } from '../../ui/select.tsx'
import { sendCopyInterval } from './queries.ts'
import { INTERVAL_LABEL, UNCONFIRMED_ACTION } from './text.ts'

/** The six intervals as the choices of a select: the label of each, once, in `text.ts`. */
export const INTERVAL_CHOICES = CopyIntervalSchema.options.map((value) => ({
  value,
  label: INTERVAL_LABEL[value],
}))

/**
 * **Intervalo** of a copy: its six choices, 15 minutes at least. A copy with no clock starts at the
 * interval chosen; a paused one stays paused (the Hub decides, criterion 26).
 */
export function IntervalDialog(props: {
  companyId: CompanyId
  copy: CopySummary
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { companyId, copy } = props
  const [chosen, setChosen] = useState<CopyInterval>(copy.interval ?? COPY_INTERVAL_DEFAULT)
  const [failure, setFailure] = useState<string>()
  const change = useMutation(sendCopyInterval)

  function onOpenChange(open: boolean) {
    if (!open) setFailure(undefined)
    props.onOpenChange(open)
  }

  function save() {
    change.mutate(
      { params: { companyId, copyId: copy.id }, body: { interval: chosen } },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
        onError: (error) => setFailure(writeFailureText(error, UNCONFIRMED_ACTION)),
      },
    )
  }

  return (
    <Dialog open={props.open} onOpenChange={onOpenChange}>
      <DialogContent
        title={`Intervalo de ${copy.label}`}
        description="De quanto em quanto tempo a cópia roda. O mínimo é 15 minutos."
      >
        <ChoiceSelect
          label="Intervalo"
          value={chosen}
          items={INTERVAL_CHOICES}
          onValueChange={(next) => setChosen(CopyIntervalSchema.parse(next))}
        />
        {failure !== undefined && <Alert tone="danger">{failure}</Alert>}
        <div className="flex flex-wrap gap-sm">
          <Button variant="primary" disabled={change.isPending} onClick={save}>
            {change.isPending ? 'Salvando…' : 'Salvar'}
          </Button>
          <Button disabled={change.isPending} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
