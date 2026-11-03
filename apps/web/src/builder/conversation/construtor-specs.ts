import { AGENT_TOOL, CONSTRUTOR_TOOL } from '@conexus/hub-api'
import {
  BotIcon,
  BuildingIcon,
  DatabaseIcon,
  FlaskConicalIcon,
  SearchIcon,
  WrenchIcon,
} from 'lucide-react'
import { z } from 'zod'
import { readRefusal } from './connector-specs.ts'
import type { ConstrutorRowTool, Refusal, ToolSpec } from './tool-spec.ts'

const Refused = z.object({ kind: z.literal('REFUSED') })

/** A result the Hub refused (`{ kind: 'REFUSED' }`): the row says its failed sentence, as the Assistant's do. */
function refusedResult(result: unknown): Refusal | undefined {
  return Refused.safeParse(result).success ? 'SAID' : undefined
}

const AppDataFailed = z.object({ kind: z.enum(['REFUSED', 'FAILED']) })

/** `app_data_read` answers `REFUSED` (the query) or `FAILED` (the app's data, out of reach): both read as failed. */
function appDataRefusal(result: unknown): Refusal | undefined {
  return AppDataFailed.safeParse(result).success ? 'SAID' : undefined
}

/** The rows of the Construtor's own tools (step 24.3, U5): the person reads what was done to the agent, never a tool's name. */
export const CONSTRUTOR_SPECS: Record<ConstrutorRowTool, ToolSpec> = {
  [CONSTRUTOR_TOOL.projectRead]: {
    icon: BuildingIcon,
    running: 'Olhando o Projeto',
    done: 'Olhou o Projeto',
    failed: 'Não conseguiu olhar o Projeto',
    verb: 'olhou o Projeto',
    body: 'generic',
    groups: true,
  },
  [CONSTRUTOR_TOOL.toolSearch]: {
    icon: SearchIcon,
    running: 'Procurando ferramentas',
    done: 'Procurou ferramentas',
    failed: 'Não conseguiu procurar ferramentas',
    verb: 'procurou ferramentas',
    body: 'generic',
    groups: true,
  },
  [CONSTRUTOR_TOOL.toolSave]: {
    icon: WrenchIcon,
    running: 'Fazendo a ferramenta',
    done: 'Fez a ferramenta',
    failed: 'Não conseguiu fazer a ferramenta',
    verb: 'fez a ferramenta',
    body: 'generic',
    groups: false,
    refusal: refusedResult,
  },
  [CONSTRUTOR_TOOL.agentRead]: {
    icon: BotIcon,
    running: 'Lendo o rascunho do agente',
    done: 'Leu o rascunho do agente',
    failed: 'Não conseguiu ler o rascunho',
    verb: 'leu o rascunho',
    body: 'generic',
    groups: true,
    refusal: refusedResult,
  },
  [CONSTRUTOR_TOOL.agentDraft]: {
    icon: BotIcon,
    running: 'Montando o rascunho do agente',
    done: 'Montou o rascunho do agente',
    failed: 'Não conseguiu montar o rascunho',
    verb: 'montou o rascunho',
    body: 'agent',
    groups: false,
  },
  [CONSTRUTOR_TOOL.agentSet]: {
    icon: BotIcon,
    running: 'Ajustando o rascunho do agente',
    done: 'Ajustou o rascunho do agente',
    failed: 'Não conseguiu ajustar o rascunho',
    verb: 'ajustou o rascunho',
    body: 'agent',
    groups: false,
  },
  [CONSTRUTOR_TOOL.agentTest]: {
    icon: FlaskConicalIcon,
    running: 'Testando o agente',
    done: 'Testou o agente',
    failed: 'Não conseguiu testar o agente',
    verb: 'testou',
    body: 'generic',
    groups: true,
    refusal: refusedResult,
  },
}

/** The agent's own tools that are not the library's (step 24.3, U3): it reads the data of the app it sits in. */
export const AGENT_SPECS: Record<(typeof AGENT_TOOL)[keyof typeof AGENT_TOOL], ToolSpec> = {
  [AGENT_TOOL.appDataRead]: {
    icon: DatabaseIcon,
    running: 'Consultando os dados do app',
    done: 'Consultou os dados do app',
    failed: 'Não conseguiu consultar os dados do app',
    verb: 'consultou',
    body: 'generic',
    groups: true,
    refusal: appDataRefusal,
  },
}

/** The agent's own tool, named `tool_<slug>` (step 24.3): its row says what it read, by the slug's words. */
export function slugToolSpec(slug: string): ToolSpec {
  const words = slug.replace(/_+/g, ' ').trim()
  return {
    icon: WrenchIcon,
    running: `Consultando ${words}`,
    done: `Consultou ${words}`,
    failed: `Não conseguiu consultar ${words}`,
    verb: 'consultou',
    body: 'generic',
    groups: true,
    refusal: readRefusal,
  }
}
