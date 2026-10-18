import type { CompanyId, ProjectId } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import type { ChangeEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { keepsAttemptKey, useAttemptKey } from '../../platform/attempt-key.ts'
import { HubFailure, sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Notice } from '../../ui/notice.tsx'
import { sendVersion } from './queries.ts'
import type { Folder, FolderRefusal } from './read-folder.ts'
import { readFolder, sizeOf } from './read-folder.ts'

const UNCONFIRMED = 'Não confirmamos o envio. Tente de novo.'

function Summary({ folder }: { folder: Folder }) {
  return (
    <p className="text-label text-text-2">
      Pasta <span className="font-mono text-fact break-all">{folder.name}</span> · {sizeOf(folder)}
    </p>
  )
}

/**
 * Sends one picked folder as soon as it mounts, and again on "Tentar de novo". It is keyed by the
 * pick, so a new folder gets a new attempt key; the same folder keeps its key after a cut (web W24).
 */
function SendFolder(props: { companyId: CompanyId; projectId: ProjectId; folder: Folder }) {
  const { companyId, projectId, folder } = props
  const router = useRouter()
  const send = useMutation(sendVersion)
  const attempt = useAttemptKey()
  const started = useRef(false)
  const failure = send.error

  async function run() {
    try {
      await attempt((attemptKey) =>
        send.mutateAsync({
          params: { companyId, projectId },
          body: { manifest: folder.manifest, files: folder.files },
          attemptKey,
        }),
      )
    } catch (error) {
      // The Projeto is gone for this person: the page reads again and shows what the Hub says.
      if (error instanceof HubFailure && error.code === 'NOT_FOUND') await router.invalidate()
    }
  }

  // One send for the pick: the StrictMode remount does not send a second time.
  useEffect(() => {
    if (started.current) return
    started.current = true
    void run()
  })

  const unconfirmed = failure !== null && keepsAttemptKey(failure)
  const retries =
    unconfirmed || (failure instanceof HubFailure && FAILURES[failure.code].actionKind === 'RETRY')
  return (
    <div className="flex flex-col items-start gap-md">
      <Summary folder={folder} />
      {send.isPending && <Notice>Enviando a versão…</Notice>}
      {failure !== null && (
        <p role="alert" className="text-danger">
          {unconfirmed ? UNCONFIRMED : sentenceOf(failure)}
        </p>
      )}
      {retries && <Button onClick={() => void run()}>Tentar de novo</Button>}
    </div>
  )
}

type Pick = { id: number; read: { folder: Folder } | { refusal: FolderRefusal } }

/**
 * "Enviar versão": the person picks the folder `npm run app:pack` made and it goes at once. The
 * picker is native; the folder's files are read here, not by the Hub (web W9).
 */
export function SendVersion(props: { companyId: CompanyId; projectId: ProjectId }) {
  const input = useRef<HTMLInputElement>(null)
  const [pick, setPick] = useState<Pick>()

  async function picked(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? [])
    // The same folder picked again must fire a change.
    event.currentTarget.value = ''
    if (files.length === 0) return
    const read = await readFolder(files)
    setPick((last) => ({ id: (last?.id ?? 0) + 1, read }))
  }

  return (
    <div className="flex flex-col items-start gap-md">
      <input
        ref={input}
        type="file"
        hidden
        // The attribute is not in React's types; the browser reads the folder's files with it.
        {...{ webkitdirectory: '' }}
        aria-label="Pasta da versão"
        onChange={(event) => void picked(event)}
      />
      <Button variant="primary" onClick={() => input.current?.click()}>
        Enviar versão
      </Button>
      {pick && 'refusal' in pick.read && (
        <p role="alert" className="text-danger">
          {sentenceOf(new HubFailure(pick.read.refusal, { outcomeUnknown: false }))}
        </p>
      )}
      {pick && 'folder' in pick.read && (
        <SendFolder key={pick.id} {...props} folder={pick.read.folder} />
      )}
    </div>
  )
}
