import type { CompanyId, CompanyMemoryPage, listCompanyMemory } from '@conexus/hub-api'
import { COMPANY_INSTRUCTIONS_MAX } from '@conexus/hub-api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { z } from 'zod'
import { unconfirmedText } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Form, FormAlert, SubmitButton, setWriteError, useSchemaForm } from '../../ui/form.tsx'
import { SettingsSection } from '../../ui/settings-section.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { Empty, ReadFailure } from '../../ui/states.tsx'
import { bylineOf, PageDetail, READ_FAILED, TextBox } from './company-memory-page.tsx'
import { companyMemoryQuery, sendCompanyMemoryPage } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId_/settings/company-memory')

const INSTRUCTIONS_ID = 'company-instructions'
const NO_PAGES = 'Nenhuma página guardada ainda.'
const ONLY_MANAGERS = 'Só o dono ou um administrador muda a memória da empresa.'
const TOO_LONG = `Escreva até ${COMPANY_INSTRUCTIONS_MAX.toLocaleString('pt-BR')} caracteres.`
const UNSAVED = unconfirmedText('se as instruções foram salvas', 'Confira o texto e tente de novo.')

const InstructionsFields = z.object({ body: z.string().max(COMPANY_INSTRUCTIONS_MAX) })

type Memory = z.infer<typeof listCompanyMemory.success.body>

/** The instructions in their box; who may not change them reads the same box, with no button. */
function Instructions(props: {
  companyId: CompanyId
  instructions: CompanyMemoryPage
  may: boolean
}) {
  const { instructions } = props
  const send = useMutation(sendCompanyMemoryPage)
  const form = useSchemaForm(InstructionsFields, { body: instructions.body })
  async function submit({ body }: { body: string }) {
    try {
      const params = { companyId: props.companyId, pageId: instructions.pageId }
      await send.mutateAsync({
        params,
        body: { name: instructions.name, body, version: instructions.version },
      })
    } catch (error) {
      setWriteError(form, error, UNSAVED)
    }
  }
  return (
    <Form form={form} onSubmit={submit}>
      <TextBox
        name="body"
        label={instructions.name}
        labelledBy={`${INSTRUCTIONS_ID}-title`}
        max={COMPANY_INSTRUCTIONS_MAX}
        invalid={TOO_LONG}
        readOnly={!props.may}
      />
      <FormAlert />
      {props.may && (
        <div>
          <SubmitButton idle="Salvar" pending="Salvando…" />
        </div>
      )}
    </Form>
  )
}

function PageRow(props: { companyId: CompanyId; page: Memory['pages'][number]; may: boolean }) {
  const { page } = props
  const [open, setOpen] = useState(false)
  const detail = useId()
  return (
    <li className="flex flex-col gap-md py-md">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <div className="flex min-w-0 flex-col gap-2xs">
          <p className="font-medium break-words">{page.name}</p>
          <p className="text-label text-text-2">{bylineOf(page)}</p>
        </div>
        <Button
          size="sm"
          aria-expanded={open}
          aria-controls={detail}
          aria-label={`${open ? 'Fechar' : 'Ver'} ${page.name}`}
          onClick={() => setOpen(!open)}
        >
          {open ? 'Fechar' : 'Ver'}
        </Button>
      </div>
      {open && (
        <div id={detail}>
          <PageDetail companyId={props.companyId} page={page} may={props.may} />
        </div>
      )}
    </li>
  )
}

function Loaded({ companyId, memory }: { companyId: CompanyId; memory: Memory }) {
  const may = memory.mayManage
  return (
    <>
      <SettingsSection
        id={INSTRUCTIONS_ID}
        title={memory.instructions.name}
        description={may ? undefined : ONLY_MANAGERS}
      >
        <Instructions
          key={`${memory.instructions.version}:${memory.instructions.body}`}
          companyId={companyId}
          instructions={memory.instructions}
          may={may}
        />
      </SettingsSection>
      <SettingsSection id="company-pages" title="Páginas">
        {memory.pages.length === 0 ? (
          <Empty>{NO_PAGES}</Empty>
        ) : (
          <ul aria-label="Páginas" className="flex flex-col divide-y divide-line">
            {memory.pages.map((page) => (
              <PageRow key={page.pageId} companyId={companyId} page={page} may={may} />
            ))}
          </ul>
        )}
      </SettingsSection>
    </>
  )
}

/**
 * Configurações › Memória da empresa (U9): every member reads the instructions and the pages; an
 * owner or an administrator changes them. The frame says what the page is, from its section.
 */
export function CompanyMemory() {
  const { companyId } = route.useParams()
  const read = useQuery(companyMemoryQuery(companyId))
  if (read.isSuccess) {
    return (
      <div className="flex flex-col gap-2xl">
        <Loaded companyId={companyId} memory={read.data} />
      </div>
    )
  }
  return (
    <SettingsSection id={INSTRUCTIONS_ID} title="Instruções da empresa">
      {read.isError ? (
        <ReadFailure text={READ_FAILED} onRetry={() => void read.refetch()} />
      ) : (
        <div role="status" aria-label="Carregando" className="flex flex-col gap-sm">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
    </SettingsSection>
  )
}
