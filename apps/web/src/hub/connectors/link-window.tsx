import type {
  CompanyId,
  Connection,
  ConnectorEntry,
  LakeTablesOfConnection,
} from '@conexus/hub-api'
import { Dialog, DialogContent } from '../../ui/dialog.tsx'
import { StepBar } from '../../ui/step-bar.tsx'
import { LINKED_STEP, phoneStepText, STEP_DONE, STEPS, STEPS_LABEL } from './lake-text.ts'
import { AccessStep } from './link-access.tsx'
import { barOf, useLinkFlow } from './link-flow.ts'
import { ChooseStep, LinkedStep, TestingStep, WhenStep } from './link-steps.tsx'
import { Refused } from './said.tsx'

type Flow = ReturnType<typeof useLinkFlow>
type Props = {
  companyId: CompanyId
  entry: ConnectorEntry
  connections: readonly Connection[]
  resume?: { connection: Connection; lake: LakeTablesOfConnection }
  onClose: () => void
}

/** The refusal above the keys after a test that did not work. */
function Refusal(props: { flow: Flow; entry: ConnectorEntry }) {
  const { stage } = props.flow
  if (stage.step !== 'REFUSED') return null
  return <Refused answer={stage.answer} name={props.entry.name} />
}

function Stage(props: Props & { flow: Flow }) {
  const { flow, entry } = props
  const { stage } = flow
  switch (stage.step) {
    case 'ACCESS':
    case 'REFUSED':
      return (
        <AccessStep
          companyId={props.companyId}
          entry={entry}
          connections={props.connections}
          form={flow.form}
          connection={flow.connection}
          refusal={<Refusal flow={flow} entry={entry} />}
          since={flow.since}
          onSince={flow.setSince}
          onSubmit={flow.submit}
        />
      )
    case 'TESTING':
      return <TestingStep phase={stage.phase} system={entry.name} onClose={props.onClose} />
    case 'CHOOSE':
      return (
        <ChooseStep
          entry={entry}
          lake={stage.lake}
          picks={flow.picks}
          since={flow.since}
          askSince={props.resume !== undefined}
          refusal={flow.nameRefusal}
          onPicks={flow.setPicks}
          onSince={flow.setSince}
          onNext={() => flow.setStage({ step: 'WHEN', lake: stage.lake })}
          onBack={props.resume ? null : () => flow.setStage({ step: 'ACCESS' })}
        />
      )
    case 'WHEN':
      return (
        <WhenStep
          entry={entry}
          lake={stage.lake}
          picks={flow.picks}
          since={flow.since}
          interval={flow.interval}
          saving={flow.saving}
          error={flow.error}
          onInterval={flow.setInterval}
          onLink={() => void flow.finish(stage.lake)}
          onBack={() => flow.setStage({ step: 'CHOOSE', lake: stage.lake })}
        />
      )
    case 'LINKED':
      return (
        <LinkedStep
          companyId={props.companyId}
          system={entry.name}
          stage={stage}
          onClose={props.onClose}
        />
      )
  }
}

/**
 * The window "Ligar": one window whose step is its state. It links by the keys, tests them, reads
 * what the system offers, lets the person choose the tables and when to copy, and ends in "Ligado".
 * With `resume`, the connection exists without a copy and it opens at "O que copiar", which then
 * asks for "Desde" itself, since the access that would have asked is behind it.
 */
export function LinkWindow(props: Props) {
  const flow = useLinkFlow(props)
  const number = barOf(flow.stage)
  return (
    <Dialog open onOpenChange={(open) => open || props.onClose()}>
      <DialogContent title={`Ligar ${props.entry.name}`} size="fields">
        <StepBar
          label={STEPS_LABEL}
          steps={STEPS}
          current={number}
          doneLabel={STEP_DONE}
          phoneLine={number === null ? LINKED_STEP : phoneStepText(number)}
        />
        <Stage {...props} flow={flow} />
      </DialogContent>
    </Dialog>
  )
}
