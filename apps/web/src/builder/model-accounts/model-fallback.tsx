import type { CompanyId, ModelFallback, Provider } from '@conexus/hub-api'
import { MODEL_FALLBACK_MAX_LENGTH } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { FieldError } from '../../ui/field.tsx'
import { List, Row, SectionTitle } from '../../ui/list.tsx'
import { ModelPicker } from './model-picker.tsx'
import { sendFallback } from './queries.ts'
import { refusalText } from './text.ts'

function swapped(chain: readonly string[], index: number, by: -1 | 1): string[] {
  const next = [...chain]
  const other = next[index + by]
  const here = next[index]
  if (other === undefined || here === undefined) return next
  next[index + by] = here
  next[index] = other
  return next
}

/**
 * The company's automatic switch: when the accounts of the model a turn started with run out, the
 * turn goes on with the next model of this chain. Off until someone turns it on. The change is
 * saved by its button, at the revision read; the section starts again from each saved answer.
 */
export function ModelFallbackSection(props: {
  companyId: CompanyId
  providers: readonly Provider[]
  fallback: ModelFallback
}) {
  return <Editor key={props.fallback.revision} {...props} />
}

function Editor(props: {
  companyId: CompanyId
  providers: readonly Provider[]
  fallback: ModelFallback
}) {
  const [enabled, setEnabled] = useState(props.fallback.enabled)
  const [chain, setChain] = useState<readonly string[]>(props.fallback.chain)
  const [picked, setPicked] = useState<string | null>(null)
  const send = useMutation(sendFallback)
  const added =
    picked !== null && !chain.includes(picked) && chain.length < MODEL_FALLBACK_MAX_LENGTH
      ? picked
      : null
  return (
    <section aria-label="Troca automática" className="flex w-full max-w-column flex-col gap-sm">
      <SectionTitle>Troca automática</SectionTitle>
      <p className="text-text-2">{props.fallback.enabled ? 'Ligada' : 'Desligada'}</p>
      <label className="flex items-center gap-sm">
        <input type="checkbox" checked={enabled} onChange={() => setEnabled(!enabled)} />
        Trocar para o próximo modelo quando as contas acabarem
      </label>
      {chain.length === 0 ? (
        <p className="text-text-2">Nenhum modelo na fila</p>
      ) : (
        <List>
          {chain.map((model, index) => (
            <Row key={model}>
              <span>{model}</span>
              <span className="flex gap-sm">
                {index > 0 && (
                  <Button
                    aria-label={`Subir ${model}`}
                    onClick={() => setChain(swapped(chain, index, -1))}
                  >
                    Subir
                  </Button>
                )}
                {index < chain.length - 1 && (
                  <Button
                    aria-label={`Descer ${model}`}
                    onClick={() => setChain(swapped(chain, index, 1))}
                  >
                    Descer
                  </Button>
                )}
                <Button
                  aria-label={`Tirar ${model}`}
                  onClick={() => setChain(chain.filter((one) => one !== model))}
                >
                  Tirar
                </Button>
              </span>
            </Row>
          ))}
        </List>
      )}
      <ModelPicker
        providers={props.providers}
        value={picked}
        names={{ provider: 'Fornecedor do modelo da troca', model: 'Modelo da troca' }}
        onChange={setPicked}
      />
      <div>
        <Button
          disabled={added === null}
          onClick={() => {
            if (added === null) return
            setChain([...chain, added])
            setPicked(null)
          }}
        >
          Adicionar à fila
        </Button>
      </div>
      <FieldError>{send.isError ? refusalText(send.error) : undefined}</FieldError>
      <div>
        <Button
          disabled={send.isPending}
          onClick={() =>
            send.mutate({
              params: { companyId: props.companyId },
              body: { enabled, chain: [...chain], revision: props.fallback.revision },
            })
          }
        >
          {send.isPending ? 'Salvando…' : 'Salvar troca automática'}
        </Button>
      </div>
    </section>
  )
}
