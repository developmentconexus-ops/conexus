import type { CompanyId, Provider } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { FieldError } from '../../ui/field.tsx'
import { ModelPicker } from './model-picker.tsx'
import { sendDefaultModel } from './queries.ts'
import { refusalText } from './text.ts'

/** The company's default model, any model of the registry; the change is saved by its button. */
export function DefaultModel(props: {
  companyId: CompanyId
  providers: readonly Provider[]
  current: string | null
}) {
  const [picked, setPicked] = useState(props.current ?? '')
  const send = useMutation(sendDefaultModel)
  return (
    <form
      className="flex w-full max-w-column flex-col gap-sm"
      onSubmit={(event) => {
        event.preventDefault()
        send.mutate({ params: { companyId: props.companyId }, body: { model: picked } })
      }}
    >
      <ModelPicker
        providers={props.providers}
        value={picked}
        names={{ provider: 'Fornecedor do modelo padrão', model: 'Modelo padrão' }}
        onChange={setPicked}
      />
      {picked !== '' && <p className="text-label text-text-2">{`Escolhido: ${picked}`}</p>}
      <FieldError>{send.isError ? refusalText(send.error) : undefined}</FieldError>
      <div>
        <Button
          type="submit"
          disabled={send.isPending || picked === '' || picked === props.current}
        >
          {send.isPending ? 'Salvando…' : 'Salvar modelo padrão'}
        </Button>
      </div>
    </form>
  )
}
