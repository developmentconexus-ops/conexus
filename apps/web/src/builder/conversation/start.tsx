import type { CompanyId, Effort, ModelId, Project } from '@conexus/hub-api'
import { useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import { companyQuery } from '../../hub/identity/public.ts'
import { NameStep, projectsQuery } from '../../hub/projects/public.ts'
import { useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { AttachmentGroup } from '../../ui/attachment.tsx'
import { Button } from '../../ui/button.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { accountsQuery } from '../model-accounts/public.ts'
import type { Outgoing } from './attachments.ts'
import type { ComposerTools } from './composer.tsx'
import { Composer } from './composer.tsx'
import { useDraft } from './draft.ts'
import { isModelRefusal, stashHandoffFiles } from './handoff.ts'
import { chipOf } from './messages.ts'
import { ComposerModelName, ComposerModelPicker, NoAccount } from './model-choice.tsx'
import { FileChip } from './person-turn.tsx'
import { sendCreation } from './queries.ts'
import { EXAMPLES, START_NO_ACCOUNT, START_PLACEHOLDER } from './text.ts'

type Phase =
  | { kind: 'WRITING' }
  | { kind: 'NAMING'; outgoing: Outgoing }
  /** The Projeto exists; its conversation does not yet. */
  | { kind: 'STARTING'; outgoing: Outgoing; project: Project }

/** The column the box, its bar and the lists under it share. */
export const START_COLUMN = 'axis flex flex-col'

type Example = { readonly label: string; readonly text: string }

/** A chip under the box: a tap puts its words in the box and sends nothing. */
function Examples(props: { examples: readonly Example[]; onPick: (text: string) => void }) {
  return (
    <ul aria-label="Exemplos" className="flex flex-wrap justify-center gap-sm">
      {props.examples.map((example) => (
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
export function usePicked(companyId: CompanyId) {
  const accounts = useSuspenseQuery(accountsQuery(companyId)).data
  const start = accounts.defaults.start
  const [picked, setPicked] = useState<{ model: ModelId; effort: Effort } | null>(
    start && { model: start.model, effort: start.effort },
  )
  return {
    picked,
    setPicked,
    providers: accounts.choices.mine,
    usable: accounts.usableProviders.length > 0,
  }
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
        state: { handoff: { conversationId: conversation.id, content: outgoing.content } },
      })
    } catch (error) {
      if (!(error instanceof HubFailure && isModelRefusal(error.code))) throw error
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

/** The request sent, with the name of its Projeto under it: the part of a frame that its screen draws or a dialog holds. */
function NamingBody(props: {
  companyId: CompanyId
  phase: Sent
  picked: { model: ModelId; effort: Effort }
  onPhase: (phase: Phase) => void
  onOpened: () => void
}) {
  const { companyId, phase } = props
  const { outgoing } = phase
  const { company } = useSuspenseQuery(companyQuery(companyId)).data
  const projects = useQuery(projectsQuery(companyId, undefined))
  const navigate = useNavigate()
  const created = useCreated(companyId, props.picked, props.onOpened)
  return (
    <>
      <Request outgoing={outgoing} />
      <div className="border-t border-line px-lg pt-md pb-lg">
        {projects.data === undefined && projects.isError && (
          <ReadFailure text={sentenceOf(projects.error)} onRetry={() => void projects.refetch()} />
        )}
        {projects.isPending && <Skeleton className="h-20 w-full" />}
        {projects.data !== undefined && (
          <NameStep
            company={company}
            databaseReady={projects.data.databaseReady}
            locked={phase.kind === 'STARTING' ? phase.project.name : null}
            idle="Criar e começar"
            back="Voltar"
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
        )}
      </div>
    </>
  )
}

/** The request sent, with the name of its Projeto under it, in the box's place. */
function Naming(props: Parameters<typeof NamingBody>[0]) {
  return (
    <div className={`${START_COLUMN} rounded-composer border border-line bg-surface`}>
      <NamingBody {...props} />
    </div>
  )
}

/**
 * The box of a first request, with the model's button and no memory, and examples under it: the
 * Builder's Início, and the Assistant's. `onSend` takes the request out of the box; the words stay
 * in the draft until its conversation opens (criterion 12).
 */
export function StartBox(props: {
  draft: ReturnType<typeof useDraft>
  placeholder: string
  /** Chips under the bar; none draws nothing. */
  examples: readonly Example[]
  /** The model's button; none where the request does not choose the model (the Construtor's). */
  picker?: {
    picked: { model: ModelId; effort: Effort }
    onPick: (picked: { model: ModelId; effort: Effort }) => void
    providers: ReturnType<typeof usePicked>['providers']
  }
  /** The model that answers, named and not changed, where the request does not choose it (the Construtor's). */
  modelName?: ModelId
  /** False while something the request needs has not arrived: **Enviar** waits. */
  canSend?: boolean
  onSend: (outgoing: Outgoing) => Promise<boolean>
  /** The folder and the tools count after the box's **+**, and what their failures say above it. */
  tools?: ComposerTools
  /** Under the box, before the examples: what sending said. */
  notice?: ReactNode
}): ReactNode {
  const { draft } = props
  const field = useRef<HTMLTextAreaElement>(null)
  return (
    <div className={`${START_COLUMN} gap-md`}>
      <div className="md:[&_textarea]:min-h-20 [&_textarea]:min-h-16">
        <Composer
          placement="inline"
          answering={false}
          canSend={props.canSend ?? true}
          draft={draft}
          field={field}
          placeholder={props.placeholder}
          onSend={props.onSend}
          onStop={() => undefined}
          plus={props.tools?.plus}
          context={props.tools?.context}
          notice={props.tools?.notice}
          picker={
            props.modelName !== undefined ? (
              <ComposerModelName model={props.modelName} />
            ) : (
              props.picker !== undefined && (
                <ComposerModelPicker
                  providers={props.picker.providers}
                  value={props.picker.picked}
                  heading="Modelo do pedido"
                  onChange={props.picker.onPick}
                />
              )
            )
          }
        />
      </div>
      {props.notice}
      {props.examples.length > 0 && (
        <Examples
          examples={props.examples}
          onPick={(text) => {
            draft.change(text)
            field.current?.focus()
          }}
        />
      )}
    </div>
  )
}

/** The notice that takes the box's place when the person has no model account to ask with. */
export function StartWithoutAccount({ companyId }: { companyId: CompanyId }): ReactNode {
  return (
    <div className={`${START_COLUMN} rounded-composer border border-line bg-surface p-lg`}>
      <NoAccount companyId={companyId} text={START_NO_ACCOUNT} action="button" />
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
  const [phase, setPhase] = useState<Phase>({ kind: 'WRITING' })

  if (picked === null) return <StartWithoutAccount companyId={companyId} />

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
    <StartBox
      draft={draft}
      placeholder={START_PLACEHOLDER}
      examples={EXAMPLES}
      picker={{ picked, onPick: setPicked, providers }}
      onSend={(outgoing) => {
        // The request stays in the draft until its conversation opens (criterion 12).
        draft.restore(outgoing)
        setPhase({ kind: 'NAMING', outgoing })
        return Promise.resolve(true)
      }}
    />
  )
}
