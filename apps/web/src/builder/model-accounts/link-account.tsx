import type { CompanyId, ModelAccount, Owner, Provider, SignInKind } from '@conexus/hub-api'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { Notice } from '../../ui/notice.tsx'
import { KeyForm } from './key-form.tsx'
import { SignInForm } from './sign-in-form.tsx'
import { originText, stateText } from './text.ts'

type Way = 'key' | 'sign-in'

function Panel(props: {
  companyId: CompanyId
  owner: Owner
  providers: readonly Provider[]
  kinds: readonly SignInKind[]
  onLinked: (account: ModelAccount) => void
  onClose: () => void
}) {
  const [way, setWay] = useState<Way>('key')
  const panel = useRef<HTMLElement>(null)
  useEffect(() => panel.current?.focus(), [])
  return (
    <section
      ref={panel}
      tabIndex={-1}
      aria-label="Ligar conta"
      className="flex w-full max-w-column flex-col gap-lg"
      onKeyDown={(event) => event.key === 'Escape' && props.onClose()}
    >
      {props.kinds.length > 0 && (
        <div className="flex flex-wrap gap-md">
          <Button aria-pressed={way === 'key'} onClick={() => setWay('key')}>
            Chave de API
          </Button>
          <Button aria-pressed={way === 'sign-in'} onClick={() => setWay('sign-in')}>
            Entrar com assinatura
          </Button>
        </div>
      )}
      {way === 'key' ? (
        <KeyForm
          companyId={props.companyId}
          owner={props.owner}
          providers={props.providers}
          onLinked={props.onLinked}
        />
      ) : (
        <SignInForm
          companyId={props.companyId}
          owner={props.owner}
          kinds={props.kinds}
          onLinked={props.onLinked}
        />
      )}
      <div>
        <Button onClick={props.onClose}>Cancelar</Button>
      </div>
    </section>
  )
}

/**
 * The "Ligar conta" button and the panel it opens, for an API key or, where the Conexus opened
 * the kind, a subscription. Closing returns focus to the button; a linked account is said in words.
 */
export function LinkAccount(props: {
  companyId: CompanyId
  owner: Owner
  providers: readonly Provider[]
  kinds: readonly SignInKind[]
}) {
  const [open, setOpen] = useState(false)
  const [linked, setLinked] = useState<ModelAccount | undefined>(undefined)
  const button = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  useEffect(() => {
    if (wasOpen.current && !open) button.current?.focus()
    wasOpen.current = open
  }, [open])

  return (
    <div className="flex flex-col gap-md">
      {open ? (
        <Panel
          {...props}
          onLinked={(account) => {
            setLinked(account)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      ) : (
        <div>
          <Button
            ref={button}
            variant="primary"
            onClick={() => {
              setLinked(undefined)
              setOpen(true)
            }}
          >
            Ligar conta
          </Button>
        </div>
      )}
      {linked && (
        <Notice>{`${linked.label} · ${originText(linked)} · ${stateText(linked)}`}</Notice>
      )}
    </div>
  )
}
