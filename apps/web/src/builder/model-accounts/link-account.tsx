import type { CompanyId, ModelAccount, Owner, Provider, SignInKind } from '@conexus/hub-api'
import { PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { Notice } from '../../ui/notice.tsx'
import { Sheet, SheetContent, SheetTrigger } from '../../ui/sheet.tsx'
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
  return (
    <div className="flex w-full flex-col gap-lg">
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
    </div>
  )
}

/**
 * The "Ligar conta" button and the side sheet it opens, for an API key or, where the Conexus opened
 * the kind, a subscription. The sheet returns focus to the button; a linked account is said in
 * words only where no table lists it (`saysLinked`). The button is black where the queue is empty, and outlined once it holds accounts.
 */
export function LinkAccount(props: {
  companyId: CompanyId
  owner: Owner
  hasAccounts?: boolean
  /** Say the linked account in words: where no table lists it. */
  saysLinked?: boolean
  providers: readonly Provider[]
  kinds: readonly SignInKind[]
}) {
  const { hasAccounts, saysLinked, ...panel } = props
  const [open, setOpen] = useState(false)
  const [linked, setLinked] = useState<ModelAccount | undefined>(undefined)

  return (
    <div className="flex flex-col items-start gap-sm">
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (next) setLinked(undefined)
          setOpen(next)
        }}
      >
        <SheetTrigger render={<Button variant={hasAccounts ? 'default' : 'primary'} />}>
          <PlusIcon aria-hidden="true" />
          Ligar conta
        </SheetTrigger>
        <SheetContent side="right" title="Ligar conta" closeLabel="Fechar">
          <Panel
            {...panel}
            onLinked={(account) => {
              setLinked(account)
              setOpen(false)
            }}
            onClose={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
      {saysLinked && linked && (
        <Notice>{`${linked.label} · ${originText(linked)} · ${stateText(linked)}`}</Notice>
      )}
    </div>
  )
}
