import {
  appHostOf,
  CompanyNickname,
  hostLabelOf,
  NICKNAME_MAX_LENGTH,
  NICKNAME_MIN_LENGTH,
  setCompanyNickname,
  suggestedNickname,
} from '@conexus/hub-api'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, useRouter } from '@tanstack/react-router'
import { HubFailure } from '../../platform/hub.ts'
import {
  Form,
  FormAlert,
  SubmitButton,
  setServerError,
  TextField,
  useSchemaForm,
} from '../../ui/form.tsx'
import { PageTitle } from '../../ui/list.tsx'
import { chooseNickname, companyQuery } from './queries.ts'

const route = getRouteApi('/_app/companies/$companyId/setup')
const ON_THE_FIELD = ['COMPANY_NICKNAME_TAKEN', 'COMPANY_NICKNAME_RESERVED']

/**
 * The first page of a company without a nickname, for its owner: the nickname the apps' addresses
 * carry, suggested from the company's name, with the address it gives as it is typed.
 */
export function CompanySetup() {
  const { companyId } = route.useParams()
  const { company } = useSuspenseQuery(companyQuery(companyId)).data
  const router = useRouter()
  const queryClient = useQueryClient()
  const send = useMutation(chooseNickname)
  const form = useSchemaForm(setCompanyNickname.input.body, {
    nickname: suggestedNickname(company.name),
  })
  const typed = CompanyNickname.safeParse(form.watch('nickname'))
  const example = typed.success ? hostLabelOf({ name: 'pedidos', nickname: typed.data }) : undefined

  // The guard of the company's pages reads the company again before it lets the Projects open.
  async function openProjects() {
    await queryClient.invalidateQueries({
      queryKey: companyQuery(companyId).queryKey,
      refetchType: 'all',
    })
    await router.navigate({ to: '/companies/$companyId/projects', params: { companyId } })
  }

  async function submit(values: { nickname: CompanyNickname }) {
    try {
      await send.mutateAsync({ params: { companyId }, body: values })
      await openProjects()
    } catch (error) {
      if (!(error instanceof HubFailure)) setServerError(form, error)
      else if (error.code === 'COMPANY_NICKNAME_SET') await openProjects()
      else if (error.code === 'NOT_FOUND') {
        // The company is gone for this person: the guard reads it again and shows what the Hub says.
        queryClient.removeQueries({ queryKey: companyQuery(companyId).queryKey })
        await router.invalidate()
      } else if (ON_THE_FIELD.includes(error.code)) setServerError(form, error, 'nickname')
      // The rest above the button, in its row's words; none of this operation's rows asks to retry.
      else setServerError(form, error)
    }
  }

  return (
    <section className="flex w-full max-w-column flex-col gap-lg">
      <header className="flex flex-col gap-xs">
        <PageTitle>Configurar a empresa</PageTitle>
        <p className="text-text-2">
          O apelido vai no endereço dos apps da empresa. Depois de salvo, não dá para trocar.
        </p>
      </header>
      <Form form={form} onSubmit={submit}>
        <TextField
          name="nickname"
          label="Apelido"
          type="text"
          autoComplete="off"
          invalid={`Use de ${NICKNAME_MIN_LENGTH} a ${NICKNAME_MAX_LENGTH} letras minúsculas, números ou hífens.`}
        />
        {example && (
          <p className="text-label text-text-2">
            Exemplo de endereço:{' '}
            <span className="font-mono text-fact">
              {appHostOf({ label: example, appsDomain: company.appsDomain })}
            </span>
          </p>
        )}
        <FormAlert />
        <SubmitButton idle="Salvar" pending="Salvando…" />
      </Form>
    </section>
  )
}
