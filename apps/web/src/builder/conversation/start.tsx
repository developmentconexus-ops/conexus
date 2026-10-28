import type { CompanyId, Effort, ModelId, Project } from '@conexus/hub-api'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { companyQuery } from '../../hub/identity/public.ts'
import { NameStep, projectsQuery } from '../../hub/projects/public.ts'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure } from '../../platform/hub.ts'
import { AttachmentGroup } from '../../ui/attachment.tsx'
import { Button } from '../../ui/button.tsx'
import { accountsQuery } from '../model-accounts/public.ts'
import type { Outgoing } from './attachments.ts'
import { Composer } from './composer.tsx'
import { useDraft } from './draft.ts'
import type { ModelRefusal } from './handoff.ts'
import { MODEL_REFUSALS, stashHandoffFiles } from './handoff.ts'
import { chipOf } from './messages.ts'
import { ComposerModelPicker, NoAccount } from './model-choice.tsx'
import { FileChip } from './person-turn.tsx'
import { sendCreation } from './queries.ts'
import { EXAMPLES, START_NO_ACCOUNT, START_PLACEHOLDER } from './text.ts'

type Phase =
  | { kind: 'WRITING' }
  | { kind: 'NAMING'; outgoing: Outgoing }
  /** The Projeto exists; its conversation does not yet. */
  | { kind: 'STARTING'; outgoing: Outgoing; project: Project }

function isRefused(code: string): code is ModelRefusal {
  return MODEL_REFUSALS.some((one) => one === code)
}

const FRAME = 'mx-auto flex w-full max-w-[46rem] flex-col'

/** A chip under the box: a tap puts its words in the box and sends nothing. */
function Examples(props: { onPick: (text: string) => void }) {
  return (
    <ul aria-label="Exemplos" className="flex flex-wrap justify-center gap-sm">
      {EXAMPLES.map((example) => (
        <li key={example.label}>
          <Button
            onClick={() => props.onPick(example.text)}
            className="rounded-pill text-label text-text-2 hover:text-text"
          >
            {example.label}
          </Button>
        </li>
      ))}
    </ul>
  )
}

/** The request as sent, above the name: its words and its files' chips. */
function Request({ outgoing }: { outgoing: Outgoing }) {
  return (
    <div className="flex flex-col gap-sm px-lg pt-lg pb-md">
      {outgoing.files.length > 0 && (
        <AttachmentGroup role="group" aria-label="Arquivos do pedido">
          {outgoing.files.map((file) => (
            <FileChip key={file.data} file={chipOf(file)} />
          ))}
        </AttachmentGroup>
      )}
      {outgoing.content !== '' && (
        <p className="whitespace-pre-wrap break-words text-text">{outgoing.content}</p>
      )}
    </div>
  )
}

/** The model the request starts on, the person's default at first (decision 0054). */
function usePicked(companyId: CompanyId) {
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const start = accounts.defaults.start
  const [picked, setPicked] = useState<{ model: ModelId; effort: Effort } | null>(
    start && { model: start.model, effort: start.effort },
  )
  return { picked, setPicked, providers: accounts.choices.mine }
}

/**
 * The conversation of the Projeto just created, on the model picked, which then opens with the
 * request handed over. A refusal of the model opens the Projeto instead, saying so; any other
 * failure goes back to the name step, the attempt key kept for its **Tentar de novo** (web W24).
 */
function useCreated(
  companyId: CompanyId,
  picked: { model: ModelId; effort: Effort },
  onOpened: () => void,
) {
  const navigate = useNavigate()
  const create = useMutation(sendCreation)
  const attempt = useAttemptKey()
  return async (project: Project, outgoing: Outgoing) => {
    const params = { companyId, projectId: project.id }
    try {
      const { conversation } = await attempt((attemptKey) =>
        create.mutateAsync({ params, body: picked, attemptKey }),
      )
      stashHandoffFiles(conversation.id, outgoing.files)
      onOpened()
      await navigate({
        to: '/companies/$companyId/projects/$projectId/conversations/$conversationId',
        params: { ...params, conversationId: conversation.id },
        state: { handoff: { content: outgoing.content } },
      })
    } catch (error) {
      if (!(error instanceof HubFailure && isRefused(error.code))) throw error
      await navigate({
        to: '/companies/$companyId/projects/$projectId',
        params,
        state: { refused: error.code },
      })
    }
  }
}

/** The phases after **Enviar**, the request held out of the box. */
type Sent = Exclude<Phase, { kind: 'WRITING' }>

/** The request sent, with the name of its Projeto under it, in the box's place. */
function Naming(props: {
  companyId: CompanyId
  phase: Sent
  picked: { model: ModelId; effort: Effort }
  onPhase: (phase: Phase) => void
  onOpened: () => void
}) {
  const { companyId, phase } = props
  const { outgoing } = phase
  const { company } = useSuspenseQuery(companyQuery(companyId)).data
  const { databaseReady } = useSuspenseQuery(projectsQuery(companyId, undefined)).data
  const navigate = useNavigate()
  const created = useCreated(companyId, props.picked, props.onOpened)
  return (
    <div className={`${FRAME} rounded-composer border border-line bg-surface`}>
      <Request outgoing={outgoing} />
      <div className="border-t border-line px-lg pt-md pb-lg">
        <NameStep
          company={company}
          databaseReady={databaseReady}
          locked={phase.kind === 'STARTING' ? phase.project.name : null}
          onCreated={async (project) => {
            props.onPhase({ kind: 'STARTING', outgoing, project })
            await created(project, outgoing)
          }}
          onBack={() => props.onPhase({ kind: 'WRITING' })}
          onOpenProject={() => {
            if (phase.kind !== 'STARTING') return
            void navigate({
              to: '/companies/$companyId/projects/$projectId',
              params: { companyId, projectId: phase.project.id },
            })
          }}
        />
      </div>
    </div>
  )
}

/**
 * "O que vamos construir?" at work: the conversation's box, with the model's button and no memory,
 * and three examples under it. **Enviar** puts the request in the box's place with the name of its
 * Projeto; **Criar e começar** creates the Projeto, then its conversation, which opens and sends the
 * request. Without a model account, a notice takes the box's place.
 */
export function Start({ companyId }: { companyId: CompanyId }): ReactNode {
  const { picked, setPicked, providers } = usePicked(companyId)
  const draft = useDraft(`start:${companyId}`)
  const field = useRef<HTMLTextAreaElement>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'WRITING' })

  if (picked === null)
    return (
      <div className={`${FRAME} rounded-composer border border-line bg-surface p-lg`}>
        <NoAccount companyId={companyId} text={START_NO_ACCOUNT} action="button" />
      </div>
    )

  if (phase.kind !== 'WRITING')
    return (
      <Naming
        companyId={companyId}
        phase={phase}
        picked={picked}
        onPhase={setPhase}
        onOpened={() => draft.take()}
      />
    )

  return (
    <div className={`${FRAME} gap-md`}>
      <div className="md:[&_textarea]:min-h-20 [&_textarea]:min-h-16">
        <Composer
          answering={false}
          canSend
          draft={draft}
          field={field}
          placeholder={START_PLACEHOLDER}
          onSend={(outgoing) => {
            // The request stays in the draft until its conversation opens (criterion 12).
            draft.restore(outgoing)
            setPhase({ kind: 'NAMING', outgoing })
            return Promise.resolve(true)
          }}
          onStop={() => undefined}
          picker={
            <ComposerModelPicker
              providers={providers}
              value={picked}
              heading="Modelo do pedido"
              onChange={setPicked}
            />
          }
        />
      </div>
      <Examples
        onPick={(text) => {
          draft.change(text)
          field.current?.focus()
        }}
      />
    </div>
  )
}
