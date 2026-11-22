import type { Client, ClientLake } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { clockOf, dayOf } from '../../platform/dates.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Alert } from '../../ui/alert.tsx'
import { AlertDialog, AlertDialogContent, AlertDialogTrigger } from '../../ui/alert-dialog.tsx'
import { Button } from '../../ui/button.tsx'
import { Form, FormAlert, setServerError, TextField } from '../../ui/form.tsx'
import { SectionTitle } from '../../ui/list.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { useNameConfirmation } from './client-fields.tsx'
import { clientLakeQuery, sendLakeCreation, sendLakeDeletion } from './queries.ts'

const LOST =
  'Tudo o que for copiado para o lago desta empresa sai, sem volta. O dado continua nos sistemas da empresa.'

/** The lake the Hub answered, kept as the block's state until the next read. */
function useKeep(client: Client) {
  const queryClient = useQueryClient()
  const { queryKey } = clientLakeQuery(client.companyId)
  return (answer: { lake: ClientLake }) => queryClient.setQueryData(queryKey, answer)
}

/** "Criar o lago", and "Tentar de novo" after a failed creation: a refusal leaves the block as it was. */
function CreateLake({ client, label }: { client: Client; label: string }) {
  const keep = useKeep(client)
  const send = useMutation({ ...sendLakeCreation, onSuccess: keep })
  return (
    <div className="flex flex-col items-start gap-sm">
      <Button
        className="max-sm:w-full"
        disabled={send.isPending}
        onClick={() => send.mutate({ params: { companyId: client.companyId } })}
      >
        {send.isPending ? 'Criando…' : label}
      </Button>
      {send.isError && <Alert tone="danger">{sentenceOf(send.error)}</Alert>}
    </div>
  )
}

function DeleteForm({ client, onDone }: { client: Client; onDone: () => void }) {
  const keep = useKeep(client)
  const send = useMutation(sendLakeDeletion)
  const { form, ready } = useNameConfirmation(client.name)

  async function submit({ name }: { name: string }) {
    try {
      keep(await send.mutateAsync({ params: { companyId: client.companyId }, body: { name } }))
      onDone()
    } catch (error) {
      if (error instanceof HubFailure && error.code === 'CLIENT_NAME_MISMATCH') {
        setServerError(form, error, 'name')
      } else form.setError('root.server', { type: 'server', message: sentenceOf(error) })
    }
  }

  return (
    <Form form={form} onSubmit={submit}>
      <TextField
        name="name"
        label={`Digite ${client.name} para confirmar`}
        type="text"
        autoComplete="off"
        invalid={FAILURES.CLIENT_NAME_MISMATCH.phrase}
      />
      <FormAlert />
      <Button type="submit" variant="danger-confirm" disabled={!ready || send.isPending}>
        {send.isPending ? 'Apagando…' : 'Apagar o lago'}
      </Button>
      <Button type="button" disabled={send.isPending} onClick={onDone}>
        Cancelar
      </Button>
    </Form>
  )
}

/** "Apagar o lago": at once and for good, once the company's name is typed (decision B). */
function DeleteLake({ client }: { client: Client }) {
  const [open, setOpen] = useState(false)
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="danger" className="max-sm:w-full" />}>
        Apagar o lago
      </AlertDialogTrigger>
      <AlertDialogContent title={`Apagar o lago de ${client.name}?`} description={LOST}>
        <DeleteForm client={client} onDone={() => setOpen(false)} />
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** "Tentar apagar de novo": the deletion already confirmed, sent again with no name to type. */
function DeleteAgain({ client }: { client: Client }) {
  const keep = useKeep(client)
  const send = useMutation({ ...sendLakeDeletion, onSuccess: keep })
  return (
    <div className="flex flex-col items-start gap-sm">
      <Button
        className="max-sm:w-full"
        variant="danger"
        disabled={send.isPending}
        onClick={() =>
          send.mutate({ params: { companyId: client.companyId }, body: { name: client.name } })
        }
      >
        {send.isPending ? 'Apagando…' : 'Tentar apagar de novo'}
      </Button>
      {send.isError && <Alert tone="danger">{sentenceOf(send.error)}</Alert>}
    </div>
  )
}

function stateOf(client: Client, lake: ClientLake): ReactNode {
  switch (lake.state) {
    case 'NONE':
      return (
        <>
          <p>Esta empresa ainda não tem lago.</p>
          <CreateLake client={client} label="Criar o lago" />
        </>
      )
    case 'CREATING':
      return (
        <div role="status" className="flex flex-col gap-xs">
          <p>Criando o lago…</p>
          <p className="text-text-2">{`Começou às ${clockOf(lake.since)}.`}</p>
        </div>
      )
    case 'READY':
      return (
        <>
          <p className="min-w-0 break-words">
            Pronto. O lago <code className="break-all">{lake.bucket}</code>
            {` está em ${lake.region} desde ${dayOf(lake.readyAt)} ${clockOf(lake.readyAt)}.`}
          </p>
          <div>
            <DeleteLake client={client} />
          </div>
        </>
      )
    case 'FAILED':
      return (
        <>
          <p>Não deu para criar o lago. A AWS desfez o que tinha começado.</p>
          <CreateLake client={client} label="Tentar de novo" />
        </>
      )
    case 'DELETING':
      return <p role="status">Apagando o lago…</p>
    case 'DELETE_FAILED':
      return (
        <>
          <p>Não deu para apagar o lago.</p>
          <DeleteAgain client={client} />
        </>
      )
  }
}

/**
 * "Lago de dados" on a client's page (decision A): the lake's six states, read again every 5 s
 * while it moves; a read that fails stays in the block and the rest of the page stands.
 */
export function ClientLakeBlock({ client }: { client: Client }) {
  const read = useQuery(clientLakeQuery(client.companyId))
  return (
    <section aria-label="Lago de dados" className="flex min-w-0 flex-col gap-md">
      <SectionTitle>Lago de dados</SectionTitle>
      {read.data !== undefined ? (
        stateOf(client, read.data.lake)
      ) : read.isError ? (
        <div className="flex flex-col items-start gap-sm">
          <p>Não deu para ler o lago agora.</p>
          <Button className="max-sm:w-full" onClick={() => void read.refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-xs">
          <Skeleton className="w-3/4" />
          <Skeleton className="w-1/2" />
        </div>
      )}
    </section>
  )
}
