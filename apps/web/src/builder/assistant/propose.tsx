import type { CompanyId } from '@conexus/hub-api'
import { Dialog, DialogContent } from '../../ui/dialog.tsx'
import { CreateApp } from '../conversation/public.ts'

/**
 * **Criar app** (step 24.1, U4): the summary the Assistant proposed, with the name of the new
 * Projeto asked under it. Creating opens the Builder's conversation of the new Projeto with the
 * summary sent once; closing creates nothing.
 */
export function Propose(props: {
  companyId: CompanyId
  /** The summary of the proposal being turned into an app; none while the dialog is closed. */
  summary: string | undefined
  onClose: () => void
}) {
  return (
    <Dialog open={props.summary !== undefined} onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent title="Criar app" description="Dê um nome ao Projeto do app.">
        {props.summary !== undefined && (
          <CreateApp companyId={props.companyId} summary={props.summary} onClose={props.onClose} />
        )}
      </DialogContent>
    </Dialog>
  )
}
