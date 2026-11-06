import { z } from 'zod'
import { AgentId } from './agent-ids.ts'
import type { FailureRow } from './failure-row.ts'
import { ProjectId } from './library-ids.ts'

/**
 * The failures of a Projeto's agents and of the company's tool library (step 24.3, U1). A refusal
 * on a field says which in the Problem's `field` and `reason`, and the screen shows it beside it.
 */
export const AGENT_FAILURES = {
  AGENT_NOT_FOUND: {
    category: 'USER',
    settles: true,
    status: 404,
    phrase: 'Não encontramos este agente.',
    action: 'Volte aos agentes.',
    actionKind: 'INITIAL',
  },
  AGENT_DRAFT_STALE: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Outra pessoa ou o Construtor mudou este rascunho.',
    action: 'Recarregue.',
    actionKind: 'NONE',
  },
  AGENT_DRAFT_INVALID: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Falta um campo para publicar.',
    action: '',
    actionKind: 'NONE',
  },
  AGENT_TOOL_REFUSED: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Esta ferramenta não pode entrar neste agente.',
    action: '',
    actionKind: 'NONE',
  },
  AGENT_NOT_PUBLISHED: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Este agente ainda não foi publicado.',
    action: 'Publique uma versão ou converse com o rascunho.',
    actionKind: 'NONE',
  },
  AGENT_VERSION_NOT_FOUND: {
    category: 'USER',
    settles: true,
    status: 404,
    phrase: 'Não encontramos esta versão.',
    action: 'Recarregue a lista.',
    actionKind: 'NONE',
  },
  TOOL_NOT_FOUND: {
    category: 'USER',
    settles: true,
    status: 404,
    phrase: 'Não encontramos esta ferramenta.',
    action: 'Recarregue a lista.',
    actionKind: 'NONE',
  },
  TOOL_REFUSED: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'A ferramenta foi recusada.',
    action: '',
    actionKind: 'NONE',
  },
  TOOL_TEST_FAILED: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'O teste da ferramenta não passou.',
    action: '',
    actionKind: 'NONE',
  },
  TOOL_IN_USE: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Esta ferramenta está em uso.',
    action: '',
    actionKind: 'NONE',
  },
  TOOL_UNAVAILABLE: {
    category: 'THIRD_PARTY',
    settles: false,
    status: 503,
    phrase: 'Não foi possível tirar a ferramenta da Cloudflare agora.',
    action: 'Tente de novo em alguns minutos.',
    actionKind: 'RETRY',
  },
} as const satisfies Record<string, FailureRow>

/** The field of a request a refusal names, for the screen to show it beside that field (step 24.3). */
export const ProblemField = z.enum([
  'instructions',
  'model',
  'connections',
  'tools',
  'connectionId',
  'operation',
  'bound',
  'open',
  'slug',
  'source',
  'toolId',
  'kind',
])
export type ProblemField = z.infer<typeof ProblemField>

/** Why a tool, or an agent's choice of one, was refused (`TOOL_REFUSED`, `AGENT_TOOL_REFUSED`). */
export const ProblemReason = z.enum([
  'NOT_OFFERED',
  'NOT_A_READ',
  'VALUE_REFUSED',
  'UNKNOWN_FIELD',
  'FIELD_TWICE',
  'REQUIRED_MISSING',
  'SLUG_TAKEN',
  'NOT_USABLE',
  'SAME_TOOL_TWICE',
  'CODE_BY_CONSTRUTOR',
  'MODULE_STATE',
  'STALE_VERSION',
])
export type ProblemReason = z.infer<typeof ProblemReason>

/** An agent a tool names, with the Projeto it lives in, since the library is the company's and its users may be in another Projeto. */
export const NamedAgent = z.object({ id: AgentId, projectId: ProjectId, name: z.string() })
export type NamedAgent = z.infer<typeof NamedAgent>

/** The agents a refusal names, such as those that still use a tool (`TOOL_IN_USE`). */
export const ProblemAgents = z.array(NamedAgent)
export type ProblemAgents = z.infer<typeof ProblemAgents>
