import type { Page } from 'playwright-core'
import type { State } from './sweep-kit.ts'
import { AGENT_PATH, agentReplies, COMPANY_ID, rolesReplies } from './sweep-roles.ts'

const SETTINGS = `/companies/${COMPANY_ID}/settings`

/** Waits for the control the screen is for: a button or a link of that name. */
function reached(name: string) {
  return async (page: Page) => {
    await page.getByRole('button', { name }).or(page.getByRole('link', { name })).first().waitFor()
  }
}

/** The screens of Papéis da empresa (U3), so the 320 px and 16 px field checks cover them. */
export const ROLES_STATES: State[] = [
  {
    name: 'Papéis, a lista',
    path: `${SETTINGS}/roles`,
    replies: rolesReplies(),
    settle: reached('Novo papel'),
  },
  {
    name: 'Papéis, um papel aberto',
    path: `${SETTINGS}/roles?role=atendente`,
    replies: rolesReplies(),
    settle: reached('Salvar'),
  },
  {
    name: 'Papéis, o papel novo',
    path: `${SETTINGS}/roles?new=true`,
    replies: rolesReplies(),
    settle: reached('Criar papel'),
  },
  {
    name: 'O agente com a ligação selecionada',
    path: AGENT_PATH,
    replies: agentReplies(true),
    settle: reached('Marcar todas as leituras de Matriz'),
  },
]
