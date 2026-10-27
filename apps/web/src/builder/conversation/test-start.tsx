import { ATTEMPT_KEY_HEADER, createProject, ModelId } from '@conexus/hub-api'
import { fireEvent, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { setupServer } from 'msw/node'
import { COMPANY } from '../../platform/fixtures.ts'
import { PEDIDOS, PEDIDOS_ADDRESS } from '../../platform/test-hub.tsx'
import type { Answers } from './test-hub.tsx'
import { screens, view } from './test-hub.tsx'

export const HOME = `/companies/${COMPANY.id}`
export const REQUEST = 'Um app de encomendas com cliente, data de entrega e valor'
export const START = {
  model: ModelId.parse('anthropic/claude-sonnet-4'),
  effort: 'high',
  from: 'company',
  account: 'Conta anthropic',
} as const
export const UNCONFIRMED = 'Não confirmamos a criação. Tente de novo.'
export const PDF = new File(['%PDF-1.4'], 'tabela.pdf', { type: 'application/pdf' })

type Sent = { key: string | null; body: unknown }

/** Início's screen on `server`. */
export function startHub(server: ReturnType<typeof setupServer>) {
  const { open } = screens(server)

  /**
   * Início, with a model to start on unless `start` is null; each Projeto written is recorded and
   * answered by `project` (PEDIDOS created when it answers nothing), and the conversation's writes by
   * `answers`.
   */
  function home(
    options: {
      project?: () => Response | undefined
      answers?: Answers
      start?: typeof START | null
    } = {},
  ) {
    const shown = view({ start: options.start === null ? undefined : START })
    const hub = open(shown, HOME, options.answers)
    const projects: Sent[] = []
    server.use(
      http.post(`*/api/companies/${COMPANY.id}/projects`, async ({ request }) => {
        projects.push({ key: request.headers.get(ATTEMPT_KEY_HEADER), body: await request.json() })
        return (
          options.project?.() ??
          HttpResponse.json(
            createProject.success.body.parse({
              project: {
                ...PEDIDOS,
                mayDelete: true,
                mayManageVersions: true,
                address: PEDIDOS_ADDRESS,
                appVersion: null,
              },
            }),
            { status: 201 },
          )
        )
      }),
    )
    return {
      ...hub,
      projects,
      conversations: () => hub.sent.filter((one) => one.path.endsWith('/conversations')),
      messages: () => hub.sent.filter((one) => one.path.endsWith('/messages')),
    }
  }
  return home
}

export function box() {
  return screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
}

export async function request(text = REQUEST) {
  fireEvent.change(await box(), { target: { value: text } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  return screen.findByLabelText('Nome do projeto')
}

export function create(name: string) {
  fireEvent.change(screen.getByLabelText('Nome do projeto'), { target: { value: name } })
  fireEvent.click(screen.getByRole('button', { name: 'Criar e começar' }))
}
